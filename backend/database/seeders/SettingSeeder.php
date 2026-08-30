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
            'tax_rate' => '7',
            'tax_name' => 'GST',
            // Charged on the discounted subtotal; GST is then charged on both.
            'service_charge_rate' => '5',
            'service_charge_name' => 'Service Charge',
            'timezone' => 'Asia/Karachi',
            'receipt_footer' => "Thank you! Taste what you crave.\nFree Home Delivery — 0302 4777730\ncravelle.bar",
            'receipt_printer' => 'Default Printer',
            // Width of the till roll in mm — 58 for a POS-58 class printer,
            // 80 for the wider ones. The receipt is laid out to match.
            'receipt_width' => '58',
            // Blank paper fed after the last line so it clears the tear-off
            // blade — the gap is physical and varies by printer.
            'receipt_feed_mm' => '35',
            // 1 loyalty point per Rs 100 spent.
            'loyalty_earn_rate' => '0.01',
        ];

        foreach ($defaults as $key => $value) {
            Setting::query()->updateOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}
