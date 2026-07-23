<?php

namespace Database\Seeders;

use App\Models\Expense;
use App\Models\User;
use Illuminate\Database\Seeder;

class ExpenseSeeder extends Seeder
{
    public function run(): void
    {
        $manager = User::query()->where('email', 'manager@cravelle.test')->first();

        $expenses = [
            ['title' => 'Weekly meat & poultry order', 'category' => 'ingredients', 'amount' => 640.00, 'expense_date' => now()->subDays(20)],
            ['title' => 'Produce and vegetables', 'category' => 'ingredients', 'amount' => 215.50, 'expense_date' => now()->subDays(14)],
            ['title' => 'Electricity bill', 'category' => 'utilities', 'amount' => 380.00, 'expense_date' => now()->subDays(10)],
            ['title' => 'Fryer maintenance', 'category' => 'maintenance', 'amount' => 120.00, 'expense_date' => now()->subDays(6)],
            ['title' => 'Social media ads', 'category' => 'marketing', 'amount' => 90.00, 'expense_date' => now()->subDays(3)],
            ['title' => 'Packaging supplies', 'category' => 'other', 'amount' => 145.75, 'expense_date' => now()->subDay()],
        ];

        foreach ($expenses as $expense) {
            Expense::query()->updateOrCreate(
                ['title' => $expense['title']],
                [...$expense, 'expense_date' => $expense['expense_date']->toDateString(), 'user_id' => $manager->id]
            );
        }
    }
}
