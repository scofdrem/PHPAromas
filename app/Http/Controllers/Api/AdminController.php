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
     * Get current authenticated user account info.
     */
    public function account(): JsonResponse
    {
        /** @var \App\Models\User|null $user */
        $user = auth('api')->user();

        if (! $user) {
            return $this->errorResponse('Unauthenticated', 401);
        }

        return $this->successResponse([
            'first_name' => $user->first_name,
            'last_name'  => $user->last_name,
            'email'      => $user->email,
            'avatar'     => $user->avatar,
        ]);
    }

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

    /**
     * Update authenticated user account name.
     */
    public function updateAccount(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name'  => 'sometimes|string|max:255',
        ]);

        $user->update($validated);

        return $this->successResponse([
            'first_name' => $user->first_name,
            'last_name'  => $user->last_name,
            'email'      => $user->email,
            'avatar'     => $user->avatar,
        ], 'Account updated successfully');
    }

    /**
     * Change authenticated user password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $validated = $request->validate([
            'current_password'      => 'required|string',
            'new_password'          => 'required|string|min:8|confirmed',
        ]);

        if (! \Hash::check($validated['current_password'], $user->password)) {
            return $this->errorResponse('Current password is incorrect', 422);
        }

        $user->update([
            'password' => \Hash::make($validated['new_password']),
        ]);

        return $this->successResponse(null, 'Password changed successfully');
    }

    /**
     * Get feedback email address from app_configs.
     */
    public function feedbackEmail(): JsonResponse
    {
        $email = \App\Models\AppConfig::where('key', 'feedback_email')->value('value') ?? '';

        return $this->successResponse([
            'feedback_email' => $email,
        ]);
    }

    /**
     * Update feedback email address in app_configs.
     */
    public function updateFeedbackEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'feedback_email' => 'required|email|max:255',
        ]);

        \App\Models\AppConfig::updateOrCreate(
            ['key' => 'feedback_email'],
            ['value' => $validated['feedback_email']]
        );

        return $this->successResponse([
            'feedback_email' => $validated['feedback_email'],
        ], 'Feedback email updated successfully');
    }
}
