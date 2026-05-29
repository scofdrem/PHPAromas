<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Tymon\JWTAuth\Facades\JWTAuth;

class SessionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $sessions = UserSession::forUser($user->id)
            ->orderBy('last_active_at', 'desc')
            ->get()
            ->map(function ($session) use ($request) {
                $currentTokenId = JWTAuth::getPayload()->get('jti');
                return [
                    'id' => $session->id,
                    'token_id' => $session->token_id,
                    'ip_address' => $session->ip_address,
                    'user_agent' => $session->user_agent,
                    'device' => $this->parseDevice($session->user_agent),
                    'last_active' => $session->last_active_at?->diffForHumans(),
                    'created_at' => $session->created_at->diffForHumans(),
                    'is_current' => $session->token_id === $currentTokenId,
                    'revoked' => $session->revoked_at !== null,
                ];
            });

        return response()->json([
            'data' => $sessions,
        ]);
    }

    public function revoke(Request $request): JsonResponse
    {
        $tokenId = $request->input('token_id');
        $currentTokenId = JWTAuth::getPayload()->get('jti');

        // Prevent revoking current session
        if ($tokenId === $currentTokenId) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot revoke current session.',
            ], 400);
        }

        $session = UserSession::forUser($request->user()->id)
            ->where('token_id', $tokenId)
            ->first();

        if (! $session || $session->revoked_at) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found.',
            ], 404);
        }

        $session->update(['revoked_at' => now()]);

        // Also invalidate the JWT (add to blacklist)
        try {
            $token = JWTAuth::getToken();
            if ($token) {
                JWTAuth::invalidate($token);
            }
        } catch (\Exception $e) {
            // JWT may already be expired
        }

        return response()->json([
            'success' => true,
            'message' => 'Session revoked.',
        ]);
    }

    public function revokeOthers(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentTokenId = JWTAuth::getPayload()->get('jti');

        UserSession::forUser($user->id)
            ->active()
            ->where('token_id', '!=', $currentTokenId)
            ->update(['revoked_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'All other sessions revoked.',
        ]);
    }

    public function track(Request $request): void
    {
        $payload = JWTAuth::getPayload();
        $tokenId = $payload->get('jti');

        if (! $tokenId) {
            return;
        }

        UserSession::updateOrCreate(
            ['token_id' => $tokenId],
            [
                'user_id' => $request->user()->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'last_active_at' => now(),
                'fingerprint' => $payload->get('fpt'),
            ]
        );
    }

    private function parseDevice(?string $userAgent): string
    {
        if (! $userAgent) {
            return 'Unknown Device';
        }

        if (str_contains($userAgent, 'Mobile')) {
            if (str_contains($userAgent, 'iPhone')) {
                return 'iPhone';
            }
            if (str_contains($userAgent, 'Android')) {
                return 'Android';
            }
            return 'Mobile';
        }

        if (str_contains($userAgent, 'Macintosh')) {
            return 'macOS';
        }
        if (str_contains($userAgent, 'Windows')) {
            return 'Windows';
        }
        if (str_contains($userAgent, 'Linux')) {
            return 'Linux';
        }

        return 'Desktop';
    }
}