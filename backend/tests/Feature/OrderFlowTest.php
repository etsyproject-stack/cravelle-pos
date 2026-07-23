<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Database\Seeders\CouponSeeder;
use Database\Seeders\CustomerSeeder;
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
            CouponSeeder::class,
        ]);
    }

    private function actingAsRole(string $email): User
    {
        $user = User::query()->where('email', $email)->firstOrFail();
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_cashier_can_place_order_with_variant_addons_coupon_and_split_payment(): void
    {
        $this->actingAsRole('cashier@cravelle.test');

        $burger = Product::query()->where('name', 'Classic Beef Burger')->firstOrFail();
        $double = $burger->variants()->where('name', 'Double')->firstOrFail();
        $cheese = $burger->addons()->where('name', 'Extra Cheese')->firstOrFail();

        $response = $this->postJson('/api/v1/orders', [
            'order_type' => 'takeaway',
            'coupon_code' => 'SAVE10',
            'items' => [
                [
                    'product_id' => $burger->id,
                    'variant_id' => $double->id,
                    'qty' => 2,
                    'addon_ids' => [$cheese->id],
                    'notes' => 'no onions',
                ],
            ],
            'payments' => [
                ['method' => 'cash', 'amount' => 10, 'tendered' => 20],
                ['method' => 'card', 'amount' => 7.78],
            ],
        ]);

        $response->assertCreated();

        // 2 × (7.99 + 0.99) = 17.96; SAVE10 → −1.80; VAT 10% on 16.16 → 1.62
        $response->assertJsonPath('data.subtotal', '17.96')
            ->assertJsonPath('data.discount', '1.80')
            ->assertJsonPath('data.tax', '1.62')
            ->assertJsonPath('data.total', '17.78')
            ->assertJsonPath('data.payment_status', 'paid')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.items.0.notes', 'no onions')
            ->assertJsonPath('data.items.0.addons.0.addon_name', 'Extra Cheese');

        $this->assertSame(10.0, (float) $response->json('data.payments.0.change_given'));
    }

    public function test_stock_is_deducted_on_sale_and_restored_on_cancellation(): void
    {
        $this->actingAsRole('cashier@cravelle.test');

        $water = Product::query()->where('name', 'Mineral Water')->firstOrFail();
        $initialStock = $water->stock_qty;

        $orderId = $this->postJson('/api/v1/orders', [
            'order_type' => 'dine_in',
            'items' => [['product_id' => $water->id, 'qty' => 5]],
            'payments' => [['method' => 'cash', 'amount' => 5.45]],
        ])->assertCreated()->json('data.id');

        $this->assertSame($initialStock - 5, $water->refresh()->stock_qty);

        $this->patchJson("/api/v1/orders/{$orderId}/status", ['status' => 'cancelled'])
            ->assertOk();

        $this->assertSame($initialStock, $water->refresh()->stock_qty);
    }

    public function test_order_exceeding_stock_is_rejected(): void
    {
        $this->actingAsRole('cashier@cravelle.test');

        $water = Product::query()->where('name', 'Mineral Water')->firstOrFail();
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
        $burger = Product::query()->where('name', 'Veggie Burger')->firstOrFail();
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

        $customer = \App\Models\Customer::query()->where('is_walk_in', false)->firstOrFail();
        $burger = Product::query()->where('name', 'Veggie Burger')->firstOrFail();

        $earned = $this->postJson('/api/v1/orders', [
            'order_type' => 'dine_in',
            'customer_id' => $customer->id,
            'items' => [['product_id' => $burger->id, 'qty' => 2]],
            'payments' => [['method' => 'card', 'amount' => 10.98]],
        ])->assertCreated()->json('data.loyalty_points_earned');

        $this->assertGreaterThan(0, $earned);
        $this->assertSame($earned, $customer->refresh()->loyalty_points);
    }
}
