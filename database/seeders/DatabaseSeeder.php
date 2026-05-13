<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            CategorySeeder::class,
            MockDataSeeder::class,
        ]);

        // Create default admin user
        \App\Models\User::create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@1000aroms.com',
            'password' => \Illuminate\Support\Facades\Hash::make('Admin123!'),
            'is_active' => true,
        ])->assignRole('administrator');

        // Create default manager user
        \App\Models\User::create([
            'first_name' => 'Manager',
            'last_name' => 'User',
            'email' => 'manager@1000aroms.com',
            'password' => \Illuminate\Support\Facades\Hash::make('Manager123!'),
            'is_active' => true,
        ])->assignRole('manager');

        // Create default regular user
        \App\Models\User::create([
            'first_name' => 'User',
            'last_name' => 'One',
            'email' => 'user@1000aroms.com',
            'password' => \Illuminate\Support\Facades\Hash::make('User1234!'),
            'is_active' => true,
        ])->assignRole('user');

        $this->command->info('Default users created successfully!');
    }
}
