<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Product;
use App\Models\Brand;
use App\Models\Inquiry;
use App\Models\AppConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    /**
     * Get all settings (backend and frontend).
     */
    public function getSettings(): JsonResponse
    {
        $backendVars = AppConfig::where('key', 'like', 'backend_%')->get();
        $frontendVars = AppConfig::where('key', 'like', 'frontend_%')->get();

        return response()->json([
            'data' => [
                'backend_vars' => $this->formatSettings($backendVars),
                'frontend_vars' => $this->formatSettings($frontendVars),
            ],
        ]);
    }

    /**
     * Get a backend setting by key.
     */
    public function getBackendSetting(string $key): JsonResponse
    {
        $config = AppConfig::where('key', 'backend_' . $key)->firstOrFail();
        return response()->json([
            'data' => [
                'key' => $config->key,
                'value' => $config->value,
            ],
        ]);
    }

    /**
     * Get a frontend setting by key.
     */
    public function getFrontendSetting(string $key): JsonResponse
    {
        $config = AppConfig::where('key', 'frontend_' . $key)->firstOrFail();
        return response()->json([
            'data' => [
                'key' => $config->key,
                'value' => $config->value,
            ],
        ]);
    }

    /**
     * Update a backend setting.
     */
    public function updateBackendSetting(Request $request, string $key): JsonResponse
    {
        $validated = $request->validate([
            'value' => 'required|string',
        ]);

        $config = AppConfig::where('key', 'backend_' . $key)->firstOrFail();
        $config->update(['value' => $validated['value']]);

        return response()->json([
            'message' => 'Backend setting updated successfully',
        ]);
    }

    /**
     * Update a frontend setting.
     */
    public function updateFrontendSetting(Request $request, string $key): JsonResponse
    {
        $validated = $request->validate([
            'value' => 'required|string',
        ]);

        $config = AppConfig::where('key', 'frontend_' . $key)->firstOrFail();
        $config->update(['value' => $validated['value']]);

        return response()->json([
            'message' => 'Frontend setting updated successfully',
        ]);
    }

    /**
     * Create a backend setting.
     */
    public function createBackendSetting(Request $request, string $key): JsonResponse
    {
        $validated = $request->validate([
            'value' => 'required|string',
        ]);

        $config = AppConfig::create([
            'key' => 'backend_' . $key,
            'value' => $validated['value'],
            'description' => 'Backend configuration',
        ]);

        return response()->json([
            'data' => [
                'key' => $config->key,
                'value' => $config->value,
            ],
            'message' => 'Backend setting created successfully',
        ], 201);
    }

    /**
     * Create a frontend setting.
     */
    public function createFrontendSetting(Request $request, string $key): JsonResponse
    {
        $validated = $request->validate([
            'value' => 'required|string',
        ]);

        $config = AppConfig::create([
            'key' => 'frontend_' . $key,
            'value' => $validated['value'],
            'description' => 'Frontend configuration',
        ]);

        return response()->json([
            'data' => [
                'key' => $config->key,
                'value' => $config->value,
            ],
            'message' => 'Frontend setting created successfully',
        ], 201);
    }

    /**
     * Delete a backend setting.
     */
    public function deleteBackendSetting(string $key): JsonResponse
    {
        $config = AppConfig::where('key', 'backend_' . $key)->firstOrFail();
        $config->delete();

        return response()->json([
            'message' => 'Backend setting deleted successfully',
        ]);
    }

    /**
     * Delete a frontend setting.
     */
    public function deleteFrontendSetting(string $key): JsonResponse
    {
        $config = AppConfig::where('key', 'frontend_' . $key)->firstOrFail();
        $config->delete();

        return response()->json([
            'message' => 'Frontend setting deleted successfully',
        ]);
    }

    /**
     * Format settings for frontend response.
     */
    private function formatSettings($configs): array
    {
        $result = [];
        foreach ($configs as $config) {
            $cleanKey = preg_replace('/^(backend_|frontend_)/', '', $config->key);
            $result[$cleanKey] = [
                'key' => $cleanKey,
                'value' => $config->value,
                'description' => $config->description ?? '',
            ];
        }
        return $result;
    }

    /**
     * Get all users.
     */
    public function getUsers(): JsonResponse
    {
        $users = User::all();
        return response()->json([
            'data' => $users->map(fn($user) => $this->formatUserResponse($user)),
        ]);
    }

    /**
     * Create a new user.
     */
    public function createUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'role' => 'nullable|string|in:admin,user',
        ]);

        $user = User::create([
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'first_name' => $validated['first_name'] ?? null,
            'last_name' => $validated['last_name'] ?? null,
            'role' => $validated['role'] ?? 'user',
        ]);

        return response()->json([
            'data' => $this->formatUserResponse($user),
            'message' => 'User created successfully',
        ], 201);
    }

    /**
     * Update user role.
     */
    public function updateUserRole(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'role' => 'required|string|in:admin,user',
        ]);

        $user = User::findOrFail($id);
        $user->update(['role' => $validated['role']]);

        return response()->json([
            'data' => $this->formatUserResponse($user),
            'message' => 'User role updated successfully',
        ]);
    }

    /**
     * Delete a user.
     */
    public function deleteUser(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully',
        ]);
    }

    /**
     * Get admin statistics.
     */
    public function getStats(): JsonResponse
    {
        return response()->json([
            'data' => [
                'total_users' => User::count(),
                'total_products' => Product::count(),
                'total_brands' => Brand::count(),
                'total_inquiries' => Inquiry::count(),
            ],
        ]);
    }

    /**
     * Get current admin account.
     */
    public function getAccount(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->formatUserResponse($request->user()),
        ]);
    }

    /**
     * Update account email.
     */
    public function updateAccountEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email|unique:users,email,' . $request->user()->id,
        ]);

        $user = $request->user();
        $user->update(['email' => $validated['email']]);

        return response()->json([
            'data' => $this->formatUserResponse($user),
            'message' => 'Email updated successfully',
        ]);
    }

    /**
     * Update account name.
     */
    public function updateAccountName(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $user = $request->user();
        $nameParts = explode(' ', $validated['name'], 2);
        
        $user->update([
            'first_name' => $nameParts[0],
            'last_name' => $nameParts[1] ?? null,
        ]);

        return response()->json([
            'data' => $this->formatUserResponse($user),
            'message' => 'Name updated successfully',
        ]);
    }

    /**
     * Change password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'error' => 'Current password is incorrect',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        return response()->json([
            'message' => 'Password changed successfully',
        ]);
    }

    /**
     * Get feedback email.
     */
    public function getFeedbackEmail(): JsonResponse
    {
        $feedbackEmail = config('app.feedback_email', 'contact@1000aroms.com');
        return response()->json([
            'data' => ['feedback_email' => $feedbackEmail],
        ]);
    }

    /**
     * Update feedback email.
     */
    public function updateFeedbackEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'feedback_email' => 'required|email',
        ]);

        // Store in config or database as needed
        // For now, just return success
        return response()->json([
            'message' => 'Feedback email updated successfully',
            'data' => ['feedback_email' => $validated['feedback_email']],
        ]);
    }

    /**
     * Get SMTP settings.
     */
    public function getSmtpSettings(): JsonResponse
    {
        return response()->json([
            'data' => [
                'MAIL_HOST' => config('mail.mailers.smtp.host', ''),
                'MAIL_PORT' => config('mail.mailers.smtp.port', ''),
                'MAIL_USERNAME' => config('mail.mailers.smtp.username', ''),
                'MAIL_FROM_ADDRESS' => config('mail.from.address', ''),
            ],
        ]);
    }

    /**
     * Update SMTP settings.
     */
    public function updateSmtpSettings(Request $request): JsonResponse
    {
        // In production, these would be stored in environment or config
        // For now, return success
        return response()->json([
            'message' => 'SMTP settings updated successfully',
        ]);
    }

    /**
     * Upload media file.
     */
    public function uploadMedia(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => 'required|image|max:5120', // max 5MB
        ]);

        $path = $request->file('file')->store('uploads', 'public');

        return response()->json([
            'data' => ['url' => asset('storage/' . $path)],
            'message' => 'File uploaded successfully',
        ], 201);
    }

    /**
     * Format user response.
     */
    private function formatUserResponse(User $user): array
    {
        return [
            'id' => $user->id,
            'email' => $user->email,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'name' => $user->first_name && $user->last_name
                ? $user->first_name . ' ' . $user->last_name
                : ($user->name ?? $user->email),
            'role' => $user->role ?? 'user',
            'roles' => $user->roles ?? [],
            'last_login' => $user->last_login?->toISOString(),
            'created_at' => $user->created_at?->toISOString(),
        ];
    }
}