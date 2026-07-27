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
            ['title' => 'Chicken & meat supply', 'category' => 'ingredients', 'amount' => 85000, 'expense_date' => now()->subDays(20)],
            ['title' => 'Vegetables and salad', 'category' => 'ingredients', 'amount' => 18500, 'expense_date' => now()->subDays(14)],
            ['title' => 'Electricity bill', 'category' => 'utilities', 'amount' => 42000, 'expense_date' => now()->subDays(10)],
            ['title' => 'Fryer maintenance', 'category' => 'maintenance', 'amount' => 9500, 'expense_date' => now()->subDays(6)],
            ['title' => 'Social media ads', 'category' => 'marketing', 'amount' => 12000, 'expense_date' => now()->subDays(3)],
            ['title' => 'Packaging & boxes', 'category' => 'other', 'amount' => 22000, 'expense_date' => now()->subDay()],
        ];

        foreach ($expenses as $expense) {
            Expense::query()->updateOrCreate(
                ['title' => $expense['title']],
                [...$expense, 'expense_date' => $expense['expense_date']->toDateString(), 'user_id' => $manager->id]
            );
        }
    }
}
