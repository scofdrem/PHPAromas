<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Middleware that accepts both valid AND expired JWT tokens.
 * Used for the refresh endpoint where an expired token should still be refreshable.
 */
class EnsureTokenIsValidOrExpired
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = JWTAuth::getToken();

        if (! $token) {
            return response()->json(['message' => 'Token not provided'], 401);
        }

        try {
            // Try to authenticate - this will fail if token is expired
            JWTAuth::authenticate($token);
        } catch (TokenExpiredException $e) {
            // Expired is OK - we can still refresh it
            // Store the token so the controller can refresh it
            $request->attributes->set('jwt_token_expired', true);
        } catch (JWTException $e) {
            // Invalid token (bad signature, malformed, etc.) - reject
            return response()->json(['message' => 'Invalid token'], 401);
        }

        return $next($request);
    }
}