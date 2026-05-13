<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponseTrait;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    use ApiResponseTrait;

    /**
     * Sign in with email and password (matches Python: POST /api/v1/auth/sign-in/email).
     */
    public function signInEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if (! $token = JWTAuth::attempt($validated)) {
            return $this->errorResponse('Invalid credentials', 401);
        }

        $user = auth()->user();

        if (! $user->is_active) {
            return $this->errorResponse('Account is deactivated', 403);
        }

        return $this->successResponse([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => JWTAuth::factory()->getTTL() * 60,
            'user' => $user,
        ]);
    }

    /**
     * Sign up with email and password (matches Python: POST /api/v1/auth/sign-up/email).
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

        // Assign default 'user' role
        $user->assignRole('user');

        $token = JWTAuth::fromUser($user);

        return $this->successResponse([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => JWTAuth::factory()->getTTL() * 60,
            'user' => $user,
        ], 'User registered successfully', 201);
    }

    /**
     * Sign in with username (alternative login method).
     */
    public function signInUsername(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        // Try to find user by email or first_name (username)
        $user = User::where('email', $validated['username'])
            ->orWhere('first_name', $validated['username'])
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return $this->errorResponse('Invalid credentials', 401);
        }

        if (! $user->is_active) {
            return $this->errorResponse('Account is deactivated', 403);
        }

        $token = JWTAuth::fromUser($user);

        return $this->successResponse([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => JWTAuth::factory()->getTTL() * 60,
            'user' => $user,
        ]);
    }

    /**
     * Register a new user (legacy endpoint).
     */
    public function register(Request $request): JsonResponse
    {
        return $this->signUpEmail($request);
    }

    /**
     * Login user (legacy endpoint).
     */
    public function login(Request $request): JsonResponse
    {
        return $this->signInEmail($request);
    }

    /**
     * Get the authenticated user (matches Python: GET /api/v1/auth/me).
     */
    public function me(): JsonResponse
    {
        $user = auth()->user();

        return $this->successResponse([
            'id' => $user->id,
            'email' => $user->email,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'name' => $user->full_name,
            'role' => $user->roles->first()?->name ?? 'user',
            'is_active' => $user->is_active,
            'created_at' => $user->created_at,
        ]);
    }

    /**
     * Refresh a token (matches Python: POST /api/v1/auth/refresh).
     */
    public function refresh(): JsonResponse
    {
        try {
            $token = JWTAuth::refresh();

            return $this->successResponse([
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => JWTAuth::factory()->getTTL() * 60,
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('Could not refresh token', 401);
        }
    }

    /**
     * Log the user out (invalidate the token).
     */
    public function logout(): JsonResponse
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());

            return $this->successResponse(null, 'Successfully logged out');
        } catch (\Exception $e) {
            return $this->errorResponse('Could not logout', 500);
        }
    }
}