<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        // Every till needs a walk-in record; real customers are added on the
        // Customers screen as they come in.
        Customer::query()->updateOrCreate(
            ['is_walk_in' => true],
            ['name' => 'Walk-in Customer']
        );
    }
}
