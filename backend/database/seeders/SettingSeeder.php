<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'restaurant_name' => 'Cravelle Fast Food',
            'restaurant_address' => '42 Flavor Street, Food City',
            'restaurant_phone' => '+1 555 010 4242',
            'currency_symbol' => '$',
            'currency_code' => 'USD',
            'tax_rate' => '10',
            'tax_name' => 'VAT',
            'timezone' => 'UTC',
            'receipt_footer' => 'Thank you for your order! See you again soon.',
            'receipt_printer' => 'EPSON TM-T20III',
            'loyalty_earn_rate' => '1',
        ];

        foreach ($defaults as $key => $value) {
            Setting::query()->updateOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}
