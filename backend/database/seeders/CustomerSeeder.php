<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        Customer::query()->updateOrCreate(
            ['is_walk_in' => true],
            ['name' => 'Walk-in Customer']
        );

        $customers = [
            ['name' => 'Sarah Malik', 'phone' => '+1 555 220 0101', 'email' => 'sarah@example.com'],
            ['name' => 'James Carter', 'phone' => '+1 555 220 0102', 'email' => 'james@example.com'],
            ['name' => 'Aisha Khan', 'phone' => '+1 555 220 0103', 'email' => 'aisha@example.com'],
            ['name' => 'Diego Ramos', 'phone' => '+1 555 220 0104', 'email' => 'diego@example.com'],
            ['name' => 'Mei Lin', 'phone' => '+1 555 220 0105', 'email' => 'mei@example.com'],
        ];

        foreach ($customers as $customer) {
            Customer::query()->updateOrCreate(['phone' => $customer['phone']], $customer);
        }
    }
}
