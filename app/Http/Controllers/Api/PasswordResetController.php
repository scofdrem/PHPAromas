<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PasswordResetMail;
use App\Models\PasswordResetToken;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class PasswordResetController extends Controller
{
    /**
     * Send a password reset link/email to the user.
     */
    public function sendResetLink(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|string|email']);

        $user = User::where('email', $request->email)->first();

        // Always return success to prevent email enumeration
        if (! $user) {
            return response()->json([
                'success' => true,
                'message' => 'If an account with that email exists, a reset link has been sent.',
            ]);
        }

        // Invalidate any existing tokens for this user
        PasswordResetToken::where('user_id', $user->id)
            ->where('used', false)
            ->update(['used' => true]);

        // Generate a secure token
        $token = bin2hex(random_bytes(32));

        PasswordResetToken::create([
            'user_id' => $user->id,
            'token' => hash('sha256', $token),
            'expires_at' => now()->addHour(),
        ]);

        // Send email with reset link
        try {
            Mail::to($user->email)->send(new PasswordResetMail($token));
        } catch (\Throwable $e) {
            // Log the error but don't expose it to the client
            logger()->error('Password reset email failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'email' => $user->email,
            ]);

            if (config('app.env') === 'local') {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send reset email. Check mail configuration.',
                    'error' => $e->getMessage(),
                ], 500);
            }
        }

        if (config('app.env') === 'local') {
            return response()->json([
                'success' => true,
                'message' => 'If an account with that email exists, a reset link has been sent.',
                'dev_token' => $token,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'If an account with that email exists, a reset link has been sent.',
        ]);
    }

    /**
     * Reset the user's password using a valid token.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $hashedToken = hash('sha256', $request->token);

        $resetToken = PasswordResetToken::where('token', $hashedToken)
            ->where('used', false)
            ->first();

        if (! $resetToken) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired reset token.',
            ], 400);
        }

        if ($resetToken->isExpired()) {
            $resetToken->update(['used' => true]);
            return response()->json([
                'success' => false,
                'message' => 'Reset token has expired. Please request a new one.',
            ], 400);
        }

        $user = $resetToken->user;

        // Update password
        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Mark token as used
        $resetToken->update(['used' => true]);

        // Invalidate all existing JWT tokens for this user
        // Force re-authentication with new password
        auth()->setUser($user);
        \Tymon\JWTAuth\Facades\JWTAuth::invalidate(\Tymon\JWTAuth\Facades\JWTAuth::getToken());

        return response()->json([
            'success' => true,
            'message' => 'Password has been reset successfully.',
        ]);
    }
}