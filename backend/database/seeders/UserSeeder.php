<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['name' => 'Alex Admin', 'email' => 'admin@cravelle.test', 'role' => UserRole::Admin],
            ['name' => 'Morgan Manager', 'email' => 'manager@cravelle.test', 'role' => UserRole::Manager],
            ['name' => 'Casey Cashier', 'email' => 'cashier@cravelle.test', 'role' => UserRole::Cashier],
            ['name' => 'Kim Kitchen', 'email' => 'kitchen@cravelle.test', 'role' => UserRole::Kitchen],
        ];

        foreach ($users as $user) {
            User::query()->updateOrCreate(
                ['email' => $user['email']],
                [...$user, 'password' => 'password']
            );
        }
    }
}
