<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware that sets the JWT token as an httpOnly cookie on auth responses.
 * Applies to login, register, and refresh endpoints.
 */
class SetAuthCookie
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only set cookie if response has a token (from login/register/refresh)
        $data = $response->getData(true);
        
        if (is_array($data) && isset($data['data']['access_token'])) {
            $token = $data['data']['access_token'];
            
            // Set httpOnly cookie
            $cookieName = config('jwt.cookie_key', 'jwt_token');
            $secure = config('session.secure', false);
            $sameSite = config('session.same_site', 'lax');
            
            $response->cookie(
                $cookieName,
                $token,
                config('jwt.ttl', 60), // minutes
                config('session.path', '/'),
                config('session.domain'),
                $secure,
                true, // httpOnly
                false,
                $sameSite
            );
            
            // Remove access_token from JSON response for security
            unset($data['data']['access_token']);
            unset($data['data']['token_type']);
            unset($data['data']['expires_in']);
            $response->setData($data);
        }

        return $response;
    }
}