<?php

namespace Database\Seeders;

use App\Models\Coupon;
use Illuminate\Database\Seeder;

class CouponSeeder extends Seeder
{
    public function run(): void
    {
        $coupons = [
            ['code' => 'SAVE10', 'type' => 'percent', 'value' => 10, 'min_order_amount' => 10, 'max_uses' => null, 'expires_at' => now()->addMonths(3)],
            ['code' => 'WELCOME5', 'type' => 'fixed', 'value' => 5, 'min_order_amount' => 15, 'max_uses' => 100, 'expires_at' => now()->addMonths(1)],
            ['code' => 'COMBO20', 'type' => 'percent', 'value' => 20, 'min_order_amount' => 25, 'max_uses' => 50, 'expires_at' => now()->addWeeks(2)],
        ];

        foreach ($coupons as $coupon) {
            Coupon::query()->updateOrCreate(['code' => $coupon['code']], [...$coupon, 'is_active' => true]);
        }
    }
}
