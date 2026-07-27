<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Production seed: staff logins, shop settings, the live menu and the
 * walk-in customer. No invented sales — your reports start from your
 * first real order.
 *
 * For a populated demo (sample customers, coupons, expenses and a month of
 * fake orders) run: php artisan db:seed --class=DemoDataSeeder
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            SettingSeeder::class,
            MenuSeeder::class,
            CustomerSeeder::class,
        ]);
    }
}
