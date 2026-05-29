<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });

        // JWT exceptions → uniform messages
        $this->renderable(function (TokenExpiredException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session expired. Please log in again.',
                ], 401);
            }
        });

        $this->renderable(function (TokenInvalidException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session expired. Please log in again.',
                ], 401);
            }
        });

        // Authentication failures → uniform message
        $this->renderable(function (AuthenticationException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session expired. Please log in again.',
                ], 401);
            }
        });

        // Not found → uniform message
        $this->renderable(function (NotFoundHttpException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Resource not found.',
                ], 404);
            }
        });
    }

    /**
     * Convert a validation exception into a JSON response with uniform format.
     */
    protected function invalidJson($request, ValidationException $exception)
    {
        return response()->json([
            'success' => false,
            'message' => 'Validation failed.',
            'errors' => $exception->errors(),
        ], 422);
    }

    /**
     * Prepare exception for rendering. Never leak internal details.
     */
    protected function prepareException(Throwable $e): Throwable
    {
        // Suppress detailed exception info in production
        if (config('app.debug') === false) {
            $e = match (true) {
                $e instanceof ValidationException => $e,
                $e instanceof AuthenticationException => $e,
                $e instanceof TokenExpiredException => $e,
                $e instanceof TokenInvalidException => $e,
                $e instanceof NotFoundHttpException => $e,
                default => new \RuntimeException('An unexpected error occurred.', 500, $e),
            };
        }
        return parent::prepareException($e);
    }
}
