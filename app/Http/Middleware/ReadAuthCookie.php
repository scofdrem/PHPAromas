<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware that reads the JWT from an httpOnly cookie and sets it
 * as the Bearer token in the request header. This allows the auth:api
 * guard to work with cookie-based authentication instead of requiring
 * the Authorization header from the frontend.
 */
class ReadAuthCookie
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $cookieName = config('jwt.cookie_key', 'jwt_token');

        // Try cookie first, fall back to Authorization header
        if ($token = $request->cookie($cookieName)) {
            $request->headers->set('Authorization', 'Bearer ' . $token);
        }

        return $next($request);
    }
}