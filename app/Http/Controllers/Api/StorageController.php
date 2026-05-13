<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StorageController extends Controller
{
    use ApiResponseTrait;

    /**
     * Get storage usage statistics.
     */
    public function index(): JsonResponse
    {
        $storageUsage = [
            'total' => Storage::size('public'),
            'used' => Storage::size('public'),
            'available' => Storage::size('public'),
            'percentage' => 100,
        ];

        return $this->successResponse($storageUsage);
    }

    /**
     * List files in storage.
     */
    public function listFiles(Request $request): JsonResponse
    {
        $path = $request->get('path', '');
        $files = Storage::files('public/'.$path);

        $fileList = [];
        foreach ($files as $file) {
            $fileList[] = [
                'name' => basename($file),
                'path' => $file,
                'size' => Storage::size($file),
                'last_modified' => Storage::lastModified($file),
            ];
        }

        return $this->successResponse($this->collectionResponse(collect($fileList), 'files'));
    }

    /**
     * Upload a file.
     */
    public function upload(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'path' => 'nullable|string|max:255',
        ]);

        $path = $request->file('file')->store('public/'.$request->get('path', ''));

        return $this->successResponse([
            'path' => $path,
            'url' => Storage::url($path),
        ], 'File uploaded successfully', 201);
    }

    /**
     * Delete a file.
     */
    public function delete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'path' => 'required|string|max:255',
        ]);

        if (Storage::exists($validated['path'])) {
            Storage::delete($validated['path']);
            return $this->successResponse(null, 'File deleted successfully');
        }

        return $this->errorResponse('File not found', 404);
    }

    /**
     * Get a temporary URL for a file.
     */
    public function getTemporaryUrl(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'path' => 'required|string|max:255',
            'expiration' => 'nullable|integer|min:1|max:3600',
        ]);

        if (!Storage::exists($validated['path'])) {
            return $this->errorResponse('File not found', 404);
        }

        $url = Storage::temporaryUrl(
            $validated['path'],
            now()->addMinutes($validated['expiration'] ?? 60)
        );

        return $this->successResponse([
            'url' => $url,
        ]);
    }
}