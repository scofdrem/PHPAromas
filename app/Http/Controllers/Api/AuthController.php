<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\LoginActivityService;
use App\Traits\HasTokenFingerprint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    use HasTokenFingerprint;

    private LoginActivityService $loginActivityService;

    public function __construct(LoginActivityService $loginActivityService)
    {
        $this->loginActivityService = $loginActivityService;
    }
    /**
     * Sign in with email and password.
     */
    public function signInEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            $this->loginActivityService->recordFailure($request, null, 'invalid_credentials');
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if ($user->locked_until && $user->locked_until->isFuture()) {
            $this->loginActivityService->recordFailure($request, $user, 'account_locked');
            return response()->json([
                'success' => false,
                'message' => 'Account locked. Try again later.',
            ], 429);
        }

        $fingerprint = $this->generateTokenFingerprint($request);
        $customClaims = ['fpt' => $fingerprint];

        if (! $token = JWTAuth::claims($customClaims)->attempt($validated)) {
            $this->recordFailedLogin($user, $request);
            $this->loginActivityService->recordFailure($request, $user, 'invalid_credentials');
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if (! $user->is_active) {
            $this->loginActivityService->recordFailure($request, $user, 'account_deactivated');
            return response()->json([
                'success' => false,
                'message' => 'Account is deactivated.',
            ], 403);
        }

        $this->resetFailedLogin($user);
        $this->loginActivityService->recordSuccess($request, $user);

        return response()->json([
            'data' => [
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => JWTAuth::factory()->getTTL() * 60,
                'user' => $user,
            ],
        ]);
    }

    /**
     * Sign up with email and password.
     */
    public function signUpEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
        ]);

        $firstName = $validated['first_name'] ?? explode('@', $validated['email'])[0];
        $lastName = $validated['last_name'] ?? '';

        $user = User::create([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_active' => true,
        ]);

        $user->assignRole('user');

        $fingerprint = $this->generateTokenFingerprint($request);
        $token = JWTAuth::fromUser($user, ['fpt' => $fingerprint]);

        return response()->json([
            'data' => [
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => JWTAuth::factory()->getTTL() * 60,
                'user' => $user,
            ],
            'message' => 'User registered successfully',
        ], 201);
    }

    /**
     * Get the authenticated user.
     */
    public function me(): JsonResponse
    {
        $user = auth()->user();

        return response()->json([
            'data' => [
                'id' => $user->id,
                'email' => $user->email,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'name' => $user->full_name,
                'role' => $user->roles->first()?->name ?? 'user',
                'is_active' => $user->is_active,
                'created_at' => $user->created_at,
            ],
        ]);
    }

    /**
     * Refresh a token.
     * Accepts token from cookie (auth_token) or Authorization header.
     */
    public function refresh(Request $request): JsonResponse
    {
        try {
            // Get token from cookie (jwt_token) or header (Bearer)
            $token = $request->cookie('jwt_token') ?? $request->bearerToken();

            if (!$token) {
                return response()->json([
                    'success' => false,
                    'message' => 'No token to refresh',
                ], 401);
            }

            $fingerprint = $this->generateTokenFingerprint($request);
            $token = JWTAuth::setToken($token)->claims(['fpt' => $fingerprint])->refresh();

            return response()->json([
                'data' => [
                    'access_token' => $token,
                    'token_type' => 'bearer',
                    'expires_in' => JWTAuth::factory()->getTTL() * 60,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Session expired. Please log in again.',
            ], 401);
        }
    }

    /**
     * Log the user out.
     */
    public function logout(): JsonResponse
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());

            return response()->json([
                'success' => true,
                'message' => 'Successfully logged out',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An unexpected error occurred.',
            ], 500);
        }
    }

    /**
     * Record a failed login attempt and lock account if threshold reached.
     */
    private function recordFailedLogin(User $user, Request $request): void
    {
        $user->failed_login_attempts++;
        if ($user->failed_login_attempts >= 5) {
            $user->locked_until = now()->addMinutes(30);
        }
        $user->save();
    }

    /**
     * Reset failed login counter on successful login.
     */
    private function resetFailedLogin(User $user): void
    {
        if ($user->failed_login_attempts > 0 || $user->locked_until) {
            $user->failed_login_attempts = 0;
            $user->locked_until = null;
            $user->save();
        }
    }
}