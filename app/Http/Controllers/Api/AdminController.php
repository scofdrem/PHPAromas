<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponseTrait;
use App\Models\Inquiry;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    use ApiResponseTrait;

    /**
     * Get dashboard statistics.
     */
    public function dashboard(): JsonResponse
    {
        $stats = [
            'total_products' => Product::count(),
            'total_users' => User::count(),
            'pending_inquiries' => Inquiry::whereNull('replied_at')->count(),
            'total_inquiries' => Inquiry::count(),
            'recent_inquiries' => Inquiry::with('replier')
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get(),
        ];

        return $this->successResponse($stats);
    }

    /**
     * Get all users with pagination.
     */
    public function users(Request $request): JsonResponse
    {
        $users = User::with('roles')
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return $this->successResponse($this->paginatedResponse($users, 'users'));
    }

    /**
     * Update user role.
     */
    public function updateUserRole(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        $user->update($validated);

        return $this->successResponse([
            'user' => $user->fresh()->load('role'),
        ], 'User role updated successfully');
    }

    /**
     * Delete a user.
     */
    public function deleteUser(User $user): JsonResponse
    {
        $user->delete();

        return $this->successResponse(null, 'User deleted successfully');
    }

    /**
     * Get system settings.
     */
    public function settings(): JsonResponse
    {
        return $this->successResponse([
            'php_version' => phpversion(),
            'laravel_version' => app()->version(),
            'environment' => app()->environment(),
            'debug_mode' => config('app.debug'),
            'timezone' => config('app.timezone'),
        ]);
    }
}