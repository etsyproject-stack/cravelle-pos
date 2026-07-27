<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\CouponSeeder;
use Database\Seeders\CustomerSeeder;
use Database\Seeders\DemoCustomerSeeder;
use Database\Seeders\MenuSeeder;
use Database\Seeders\SettingSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([
            UserSeeder::class,
            SettingSeeder::class,
            MenuSeeder::class,
            CustomerSeeder::class,
            DemoCustomerSeeder::class,
            CouponSeeder::class,
        ]);
    }

    private function actingAsRole(string $email): User
    {
        $user = User::query()->where('email', $email)->firstOrFail();
        Sanctum::actingAs($user);

        return $user;
    }

    private function product(string $name): Product
    {
        return Product::query()->where('name', $name)->firstOrFail();
    }

    public function test_cashier_can_place_order_with_variant_addons_coupon_and_split_payment(): void
    {
        $this->actingAsRole('cashier@cravelle.test');

        $pizza = $this->product('Cravellé Special Pizza');
        $medium = $pizza->variants()->where('name', 'Medium')->firstOrFail();
        $cheese = $pizza->addons()->where('name', 'Extra Cheese (Medium)')->firstOrFail();

        $response = $this->postJson('/api/v1/orders', [
            'order_type' => 'takeaway',
            'coupon_code' => 'SAVE10',
            'items' => [
                [
                    'product_id' => $pizza->id,
                    'variant_id' => $medium->id,
                    'qty' => 2,
                    'addon_ids' => [$cheese->id],
                    'notes' => 'extra spicy',
                ],
            ],
            'payments' => [
                ['method' => 'cash', 'amount' => 1000, 'tendered' => 2000],
                ['method' => 'card', 'amount' => 1250],
            ],
        ]);

        $response->assertCreated();

        // 2 × (1100 + 150) = 2500; SAVE10 → −250; menu prices are tax-inclusive.
        $response->assertJsonPath('data.subtotal', '2500.00')
            ->assertJsonPath('data.discount', '250.00')
            ->assertJsonPath('data.total', '2250.00')
            ->assertJsonPath('data.payment_status', 'paid')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.items.0.notes', 'extra spicy')
            ->assertJsonPath('data.items.0.addons.0.addon_name', 'Extra Cheese (Medium)');

        $this->assertSame(1000.0, (float) $response->json('data.payments.0.change_given'));
    }

    public function test_stock_is_deducted_on_sale_and_restored_on_cancellation(): void
    {
        $this->actingAsRole('cashier@cravelle.test');

        $water = $this->product('Small Water');
        $initialStock = $water->stock_qty;

        $orderId = $this->postJson('/api/v1/orders', [
            'order_type' => 'dine_in',
            'items' => [['product_id' => $water->id, 'qty' => 5]],
            'payments' => [['method' => 'cash', 'amount' => 350]],
        ])->assertCreated()->json('data.id');

        $this->assertSame($initialStock - 5, $water->refresh()->stock_qty);

        $this->patchJson("/api/v1/orders/{$orderId}/status", ['status' => 'cancelled'])->assertOk();

        $this->assertSame($initialStock, $water->refresh()->stock_qty);
    }

    public function test_order_exceeding_stock_is_rejected(): void
    {
        $this->actingAsRole('cashier@cravelle.test');

        $water = $this->product('Small Water');
        $water->update(['stock_qty' => 2]);

        $this->postJson('/api/v1/orders', [
            'order_type' => 'dine_in',
            'items' => [['product_id' => $water->id, 'qty' => 3]],
        ])->assertUnprocessable();

        $this->assertSame(2, $water->refresh()->stock_qty);
    }

    public function test_kitchen_staff_can_advance_orders_but_not_reach_pos_endpoints(): void
    {
        $this->actingAsRole('cashier@cravelle.test');
        $burger = $this->product('Crispo Burger');
        $orderId = $this->postJson('/api/v1/orders', [
            'order_type' => 'dine_in',
            'items' => [['product_id' => $burger->id, 'qty' => 1]],
        ])->json('data.id');

        $this->actingAsRole('kitchen@cravelle.test');

        $this->getJson('/api/v1/kitchen/orders')
            ->assertOk()
            ->assertJsonPath('data.0.id', $orderId);

        $this->patchJson("/api/v1/kitchen/orders/{$orderId}/advance")
            ->assertOk()
            ->assertJsonPath('data.status', 'preparing');

        $this->getJson('/api/v1/dashboard/stats')->assertForbidden();
        $this->getJson('/api/v1/orders')->assertForbidden();
    }

    public function test_cashier_cannot_manage_products_or_view_reports(): void
    {
        $this->actingAsRole('cashier@cravelle.test');

        $this->postJson('/api/v1/products', [])->assertForbidden();
        $this->getJson('/api/v1/reports/profit')->assertForbidden();
        $this->getJson('/api/v1/users')->assertForbidden();
    }

    public function test_loyalty_points_accrue_for_registered_customers(): void
    {
        $this->actingAsRole('cashier@cravelle.test');

        $customer = Customer::query()->where('is_walk_in', false)->firstOrFail();
        $burger = $this->product('Crispo Burger');

        // 2 × 650 = 1300, earning 1 point per Rs 100.
        $earned = $this->postJson('/api/v1/orders', [
            'order_type' => 'dine_in',
            'customer_id' => $customer->id,
            'items' => [['product_id' => $burger->id, 'qty' => 2]],
            'payments' => [['method' => 'card', 'amount' => 1300]],
        ])->assertCreated()->json('data.loyalty_points_earned');

        $this->assertSame(13, $earned);
        $this->assertSame(13, $customer->refresh()->loyalty_points);
    }

    public function test_bootstrap_returns_everything_the_till_needs_offline(): void
    {
        $this->actingAsRole('cashier@cravelle.test');

        $this->getJson('/api/v1/bootstrap')
            ->assertOk()
            ->assertJsonStructure(['data' => [
                'synced_at', 'categories', 'products', 'addons', 'customers', 'coupons', 'settings',
            ]])
            ->assertJsonPath('data.settings.currency_code', 'PKR');
    }

    public function test_offline_orders_sync_and_keep_the_time_they_were_taken(): void
    {
        $this->actingAsRole('cashier@cravelle.test');

        $burger = $this->product('Grill Burger');
        $placedAt = now()->subHours(3)->startOfSecond();

        $response = $this->postJson('/api/v1/orders/sync', [
            'orders' => [[
                'client_uuid' => '11111111-1111-4111-8111-111111111111',
                'placed_at' => $placedAt->toIso8601String(),
                'order_type' => 'takeaway',
                'items' => [['product_id' => $burger->id, 'qty' => 2]],
                'payments' => [['method' => 'cash', 'amount' => 1300, 'tendered' => 1500]],
            ]],
        ]);

        $response->assertOk()
            ->assertJsonCount(1, 'data.synced')
            ->assertJsonCount(0, 'data.failed');

        $order = Order::query()->where('client_uuid', '11111111-1111-4111-8111-111111111111')->firstOrFail();
        $this->assertTrue($order->placed_offline);
        $this->assertSame('paid', $order->payment_status->value);
        $this->assertSame(1300.0, (float) $order->total);
        $this->assertEquals($placedAt->toDateTimeString(), $order->created_at->toDateTimeString());
    }

    public function test_replaying_the_same_offline_order_never_bills_twice(): void
    {
        $this->actingAsRole('cashier@cravelle.test');

        $payload = ['orders' => [[
            'client_uuid' => '22222222-2222-4222-8222-222222222222',
            'placed_at' => now()->subHour()->toIso8601String(),
            'order_type' => 'dine_in',
            'items' => [['product_id' => $this->product('Club Sandwich')->id, 'qty' => 1]],
            'payments' => [['method' => 'cash', 'amount' => 800]],
        ]]];

        $first = $this->postJson('/api/v1/orders/sync', $payload)->assertOk();
        $second = $this->postJson('/api/v1/orders/sync', $payload)->assertOk();

        $this->assertSame(
            $first->json('data.synced.0.order_number'),
            $second->json('data.synced.0.order_number')
        );
        $this->assertSame(1, Order::query()->count());
        $this->assertSame(800.0, (float) Order::query()->sum('total'));
    }

    public function test_offline_order_is_still_recorded_when_stock_ran_out(): void
    {
        $this->actingAsRole('cashier@cravelle.test');

        // The drink was already handed to the customer while the till was down,
        // so the sale must be recorded even though stock says otherwise.
        $water = $this->product('Small Water');
        $water->update(['stock_qty' => 1]);

        $this->postJson('/api/v1/orders/sync', [
            'orders' => [[
                'client_uuid' => '33333333-3333-4333-8333-333333333333',
                'placed_at' => now()->subMinutes(30)->toIso8601String(),
                'order_type' => 'takeaway',
                'items' => [['product_id' => $water->id, 'qty' => 4]],
                'payments' => [['method' => 'cash', 'amount' => 280]],
            ]],
        ])->assertOk()->assertJsonCount(1, 'data.synced');

        $this->assertSame(0, $water->refresh()->stock_qty);
        $this->assertSame(280.0, (float) Order::query()->sum('total'));
    }

    public function test_a_bad_order_in_a_sync_batch_does_not_block_the_others(): void
    {
        $this->actingAsRole('cashier@cravelle.test');

        $response = $this->postJson('/api/v1/orders/sync', [
            'orders' => [
                [
                    'client_uuid' => '44444444-4444-4444-8444-444444444444',
                    'placed_at' => now()->subMinutes(20)->toIso8601String(),
                    'order_type' => 'dine_in',
                    'items' => [['product_id' => $this->product('Masala Fries')->id, 'qty' => 1]],
                    'payments' => [['method' => 'cash', 'amount' => 200]],
                ],
                [
                    'client_uuid' => '55555555-5555-4555-8555-555555555555',
                    'placed_at' => now()->subMinutes(10)->toIso8601String(),
                    'order_type' => 'dine_in',
                    // Variant belongs to another product — this one must fail alone.
                    'items' => [['product_id' => $this->product('Plain Fries')->id, 'variant_id' => 999999, 'qty' => 1]],
                    'payments' => [['method' => 'cash', 'amount' => 150]],
                ],
            ],
        ]);

        $response->assertOk()
            ->assertJsonCount(1, 'data.synced')
            ->assertJsonCount(1, 'data.failed')
            ->assertJsonPath('data.failed.0.client_uuid', '55555555-5555-4555-8555-555555555555');

        $this->assertSame(1, Order::query()->count());
    }

    public function test_order_numbers_stay_sequential_per_day(): void
    {
        $this->actingAsRole('cashier@cravelle.test');

        $fries = $this->product('Plain Fries');

        $first = $this->postJson('/api/v1/orders', [
            'order_type' => 'dine_in',
            'items' => [['product_id' => $fries->id, 'qty' => 1]],
        ])->json('data.order_number');

        $second = $this->postJson('/api/v1/orders', [
            'order_type' => 'dine_in',
            'items' => [['product_id' => $fries->id, 'qty' => 1]],
        ])->json('data.order_number');

        $this->assertSame('ORD-'.now()->format('Ymd').'-0001', $first);
        $this->assertSame('ORD-'.now()->format('Ymd').'-0002', $second);
    }
}
