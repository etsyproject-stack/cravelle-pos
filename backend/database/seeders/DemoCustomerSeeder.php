<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class DemoCustomerSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            ['name' => 'Sarah Malik', 'phone' => '0300 1112201', 'email' => 'sarah@example.com'],
            ['name' => 'Bilal Ahmed', 'phone' => '0300 1112202', 'email' => 'bilal@example.com'],
            ['name' => 'Ayesha Khan', 'phone' => '0300 1112203', 'email' => 'ayesha@example.com'],
            ['name' => 'Usman Tariq', 'phone' => '0300 1112204', 'email' => 'usman@example.com'],
            ['name' => 'Hina Rauf', 'phone' => '0300 1112205', 'email' => 'hina@example.com'],
        ];

        foreach ($customers as $customer) {
            Customer::query()->updateOrCreate(['phone' => $customer['phone']], $customer);
        }
    }
}
