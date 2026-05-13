<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiteContentController extends Controller
{
    public function index(): JsonResponse
    {
        $content = SiteContent::pluck('content_value', 'content_key');
        return response()->json(['content' => $content]);
    }

    public function show(string $key): JsonResponse
    {
        $item = SiteContent::where('content_key', $key)->firstOrFail();
        return response()->json(['data' => $item]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => 'required|string',
            'value' => 'required|string',
        ]);

        $item = SiteContent::updateOrCreate(
            ['content_key' => $validated['key']],
            ['content_value' => $validated['value']]
        );

        return response()->json(['data' => $item]);
    }
}