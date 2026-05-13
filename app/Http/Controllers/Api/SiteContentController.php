<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponseTrait;
use App\Models\SiteContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiteContentController extends Controller
{
    use ApiResponseTrait;

    /**
     * Get all site content as key-value pairs.
     */
    public function index(): JsonResponse
    {
        $contents = SiteContent::all()->pluck('content_value', 'content_key');

        return $this->successResponse(['content' => $contents]);
    }

    /**
     * Get specific content by key.
     */
    public function show(string $key): JsonResponse
    {
        $content = SiteContent::where('content_key', $key)->first();

        if (! $content) {
            return $this->errorResponse('Content not found', 404);
        }

        return $this->successResponse([
            'content' => $content,
        ]);
    }

    /**
     * Store or update content (admin only).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => 'required|string|max:255',
            'value' => 'nullable|string',
        ]);

        $content = SiteContent::updateOrCreate(
            ['content_key' => $validated['key']],
            ['content_value' => $validated['value'] ?? '']
        );

        return $this->successResponse([
            'content' => $content,
        ], $content->wasRecentlyCreated ? 'Content created successfully' : 'Content updated successfully');
    }

    /**
     * Update multiple content items at once (admin only).
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'contents' => 'required|array',
            'contents.*.key' => 'required|string|max:255',
            'contents.*.value' => 'nullable|string',
        ]);

        foreach ($validated['contents'] as $item) {
            SiteContent::updateOrCreate(
                ['content_key' => $item['key']],
                ['content_value' => $item['value'] ?? '']
            );
        }

        $contents = SiteContent::all()->pluck('content_value', 'content_key');

        return $this->successResponse($contents, 'Contents updated successfully');
    }

    /**
     * Delete content by key (admin only).
     */
    public function destroy(string $key): JsonResponse
    {
        $content = SiteContent::where('content_key', $key)->first();

        if (! $content) {
            return $this->errorResponse('Content not found', 404);
        }

        $content->delete();

        return $this->successResponse(null, 'Content deleted successfully');
    }
}