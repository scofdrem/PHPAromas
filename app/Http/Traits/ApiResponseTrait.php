<?php

namespace App\Http\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;

trait ApiResponseTrait
{
    /**
     * Transform paginated response to match Python backend format.
     * Python returns: { items: [...], total, skip, limit }
     * Laravel returns: { data: [...], links: {...}, meta: {...} }
     */
    protected function paginatedResponse($paginator, string $collectionKey = 'items'): array
    {
        return [
            $collectionKey => $paginator->items(),
            'total' => $paginator->total(),
            'skip' => ($paginator->currentPage() - 1) * $paginator->perPage(),
            'limit' => $paginator->perPage(),
        ];
    }

    /**
     * Transform collection response to match Python backend format.
     */
    protected function collectionResponse($collection, string $collectionKey = 'items'): array
    {
        if ($collection instanceof LengthAwarePaginator) {
            return $this->paginatedResponse($collection, $collectionKey);
        }

        if (is_array($collection)) {
            return [
                $collectionKey => $collection,
                'total' => count($collection),
                'skip' => 0,
                'limit' => count($collection),
            ];
        }

        return [
            $collectionKey => $collection->toArray(),
            'total' => $collection->count(),
            'skip' => 0,
            'limit' => $collection->count(),
        ];
    }

    /**
     * Success response matching Python format.
     */
    protected function successResponse(mixed $data = null, string $message = null, int $status = 200): JsonResponse
    {
        $response = [];
        
        if ($message) {
            $response['message'] = $message;
        }
        
        if ($data !== null) {
            if (is_array($data) && isset($data['items'])) {
                // Already in paginated format
                $response = array_merge($response, $data);
            } elseif ($data instanceof LengthAwarePaginator) {
                $response = array_merge($response, $this->paginatedResponse($data));
            } elseif ($data instanceof \Illuminate\Support\Collection) {
                $response = array_merge($response, $data->toArray());
            } elseif (is_array($data)) {
                $response = array_merge($response, $data);
            } else {
                $response['data'] = $data;
            }
        }
        
        return response()->json($response, $status);
    }

    /**
     * Error response matching Python backend format.
     * Python returns: { detail: "error message" }
     */
    protected function errorResponse(string $message, int $status = 400, array $errors = []): JsonResponse
    {
        $response = ['detail' => $message];
        
        if (!empty($errors)) {
            $response['errors'] = $errors;
        }
        
        return response()->json($response, $status);
    }
}