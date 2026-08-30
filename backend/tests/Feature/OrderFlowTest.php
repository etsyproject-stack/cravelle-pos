<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
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
                ['method' => 'card', 'amount' => 1726.06],
            ],
        ]);

        $response->assertCreated();

        // 2 × (1099 + 249) = 2696; SAVE10 → −269.60 leaves 2426.40;
        // 5% service = 121.32; 7% GST on 2547.72 = 178.34.
        $response->assertJsonPath('data.subtotal', '2696.00')
            ->assertJsonPath('data.discount', '269.60')
            ->assertJsonPath('data.service_charge', '121.32')
            ->assertJsonPath('data.tax', '178.34')
            ->assertJsonPath('data.total', '2726.06')
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
            'payments' => [['method' => 'cash', 'amount' => 387.61]],
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

        // 2 × 649 = 1298, +5% service +7% GST = 1458.30, at 1 point per Rs 100.
        $earned = $this->postJson('/api/v1/orders', [
            'order_type' => 'dine_in',
            'customer_id' => $customer->id,
            'items' => [['product_id' => $burger->id, 'qty' => 2]],
            'payments' => [['method' => 'card', 'amount' => 1458.30]],
        ])->assertCreated()->json('data.loyalty_points_earned');

        $this->assertSame(14, $earned);
        $this->assertSame(14, $customer->refresh()->loyalty_points);
    }

    public function test_service_charge_is_billed_before_tax_and_is_itself_taxed(): void
    {
        $this->actingAsRole('cashier@cravelle.test');

        // A single Rs 1,000 line keeps the arithmetic checkable by eye:
        // 5% service = 50, then 7% GST on 1,050 = 73.50, so the bill is
        // 1,123.50 — not 1,120, which is what charging both on the subtotal
        // would give.
        $product = $this->product('Crispo Burger');
        $product->update(['price' => 1000]);

        $this->postJson('/api/v1/orders', [
            'order_type' => 'takeaway',
            'items' => [['product_id' => $product->id, 'qty' => 1]],
            'payments' => [['method' => 'cash', 'amount' => 1123.50]],
        ])
            ->assertCreated()
            ->assertJsonPath('data.subtotal', '1000.00')
            ->assertJsonPath('data.service_charge_rate', '5.00')
            ->assertJsonPath('data.service_charge', '50.00')
            ->assertJsonPath('data.tax_rate', '7.00')
            ->assertJsonPath('data.tax', '73.50')
            ->assertJsonPath('data.total', '1123.50')
            ->assertJsonPath('data.payment_status', 'paid');
    }

    public function test_charges_stay_off_the_bill_when_their_rates_are_zero(): void
    {
        $this->actingAsRole('cashier@cravelle.test');

        Setting::query()->where('key', 'service_charge_rate')->update(['value' => '0']);
        Setting::query()->where('key', 'tax_rate')->update(['value' => '0']);

        $product = $this->product('Crispo Burger');

        $this->postJson('/api/v1/orders', [
            'order_type' => 'takeaway',
            'items' => [['product_id' => $product->id, 'qty' => 1]],
            'payments' => [['method' => 'cash', 'amount' => 649]],
        ])
            ->assertCreated()
            ->assertJsonPath('data.service_charge', '0.00')
            ->assertJsonPath('data.tax', '0.00')
            ->assertJsonPath('data.total', '649.00');
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
                'payments' => [['method' => 'cash', 'amount' => 1458.30, 'tendered' => 1500]],
            ]],
        ]);

        $response->assertOk()
            ->assertJsonCount(1, 'data.synced')
            ->assertJsonCount(0, 'data.failed');

        $order = Order::query()->where('client_uuid', '11111111-1111-4111-8111-111111111111')->firstOrFail();
        $this->assertTrue($order->placed_offline);
        $this->assertSame('paid', $order->payment_status->value);
        $this->assertSame(1458.30, (float) $order->total);
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
            'payments' => [['method' => 'cash', 'amount' => 897.68]],
        ]]];

        $first = $this->postJson('/api/v1/orders/sync', $payload)->assertOk();
        $second = $this->postJson('/api/v1/orders/sync', $payload)->assertOk();

        $this->assertSame(
            $first->json('data.synced.0.order_number'),
            $second->json('data.synced.0.order_number')
        );
        $this->assertSame(1, Order::query()->count());
        $this->assertSame(897.68, (float) Order::query()->sum('total'));
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
                'payments' => [['method' => 'cash', 'amount' => 310.09]],
            ]],
        ])->assertOk()->assertJsonCount(1, 'data.synced');

        $this->assertSame(0, $water->refresh()->stock_qty);
        $this->assertSame(310.09, (float) Order::query()->sum('total'));
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
                    'payments' => [['method' => 'cash', 'amount' => 223.58]],
                ],
                [
                    'client_uuid' => '55555555-5555-4555-8555-555555555555',
                    'placed_at' => now()->subMinutes(10)->toIso8601String(),
                    'order_type' => 'dine_in',
                    // Variant belongs to another product — this one must fail alone.
                    'items' => [['product_id' => $this->product('Plain Fries')->id, 'variant_id' => 999999, 'qty' => 1]],
                    'payments' => [['method' => 'cash', 'amount' => 167.40]],
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
