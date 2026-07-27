<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'restaurant_name' => 'Cravelle 2.0',
            'restaurant_address' => 'Shop # 18, Emirates Mall, Model Town, Multan',
            'restaurant_phone' => '0302 4777730',
            'currency_symbol' => 'Rs ',
            'currency_code' => 'PKR',
            'currency_decimals' => '0',
            // Menu prices are tax-inclusive; set a rate here if you bill GST separately.
            'tax_rate' => '0',
            'tax_name' => 'GST',
            'timezone' => 'Asia/Karachi',
            'receipt_footer' => "Thank you! Taste what you crave.\nFree Home Delivery — 0302 4777730\ncravelle.bar",
            'receipt_printer' => 'Default Printer',
            // 1 loyalty point per Rs 100 spent.
            'loyalty_earn_rate' => '0.01',
        ];

        foreach ($defaults as $key => $value) {
            Setting::query()->updateOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}
