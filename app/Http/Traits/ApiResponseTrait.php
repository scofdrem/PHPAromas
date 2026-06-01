<?php

namespace App\Http\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponseTrait
{
    /**
     * Return a successful JSON response.
     */
    protected function successResponse(mixed $data = null, string $message = '', int $code = 200): JsonResponse
    {
        $response = [
            'success' => true,
            'message' => $message,
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        return response()->json($response, $code);
    }

    /**
     * Return an error JSON response.
     */
    protected function errorResponse(string $message = '', int $code = 400): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], $code);
    }
}