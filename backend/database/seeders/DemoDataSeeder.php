<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Optional showcase data — sample customers, coupons, expenses and a month of
 * fake orders. Handy for training staff or demoing the system; never run this
 * on a till whose sales figures you rely on.
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            DemoCustomerSeeder::class,
            CouponSeeder::class,
            ExpenseSeeder::class,
            DemoOrderSeeder::class,
        ]);
    }
}
