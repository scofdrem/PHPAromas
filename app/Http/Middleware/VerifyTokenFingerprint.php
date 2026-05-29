<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Middleware that verifies the JWT token fingerprint claim matches
 * the current request's fingerprint (IP + User-Agent hash).
 * 
 * This prevents stolen tokens from being used on different devices/IPs.
 * Should run AFTER auth:api middleware so the token is already parsed.
 */
class VerifyTokenFingerprint
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $token = JWTAuth::parseToken();
            $payload = $token->getPayload();
            $fingerprint = $payload->get('fpt');

            if ($fingerprint) {
                $expectedFingerprint = $this->generateFingerprint($request);
                if (!hash_equals($expectedFingerprint, $fingerprint)) {
                    Log::warning('JWT fingerprint mismatch', [
                        'user_id' => $payload->get('sub'),
                        'ip' => $request->ip(),
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Session expired. Please log in again.',
                    ], 401);
                }
            }
        } catch (\Exception $e) {
            // Token parsing failed — let auth middleware handle it
        }

        return $next($request);
    }

    /**
     * Generate fingerprint hash from User-Agent only.
     * Must match the logic in HasTokenFingerprint trait.
     */
    private function generateFingerprint(Request $request): string
    {
        return hash('sha256', $request->userAgent() ?? '');
    }
}