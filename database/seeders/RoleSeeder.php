<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create permissions
        $permissions = [
            'view-brands',
            'create-brands',
            'edit-brands',
            'delete-brands',
            'view-products',
            'create-products',
            'edit-products',
            'delete-products',
            'view-inquiries',
            'reply-inquiries',
            'delete-inquiries',
            'manage-smtp-settings',
            'manage-site-content',
            'manage-users',
            'manage-roles',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create administrator role with all permissions
        $adminRole = Role::firstOrCreate(['name' => 'administrator']);
        $adminRole->givePermissionTo(Permission::all());

        // Create manager role with limited permissions
        $managerRole = Role::firstOrCreate(['name' => 'manager']);
        $managerPermissions = [
            'view-brands',
            'create-brands',
            'edit-brands',
            'view-products',
            'create-products',
            'edit-products',
            'view-inquiries',
            'reply-inquiries',
            'manage-smtp-settings',
            'manage-site-content',
        ];
        $managerRole->givePermissionTo($managerPermissions);

        // Create user role with basic permissions
        $userRole = Role::firstOrCreate(['name' => 'user']);
        $userPermissions = [
            'view-brands',
            'view-products',
        ];
        $userRole->givePermissionTo($userPermissions);

        $this->command->info('Roles and permissions created successfully!');
    }
}