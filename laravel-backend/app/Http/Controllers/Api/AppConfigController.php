<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppConfigController extends Controller
{
    public function index(): JsonResponse
    {
        $configs = AppConfig::pluck('config_value', 'config_key');
        return response()->json(['configs' => $configs]);
    }

    public function show(string $key): JsonResponse
    {
        $item = AppConfig::where('config_key', $key)->firstOrFail();
        return response()->json(['data' => [
            'key' => $item->config_key,
            'value' => $item->config_value,
        ]]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'config_key' => 'required|string',
            'config_value' => 'nullable|string',
        ]);

        $item = AppConfig::updateOrCreate(
            ['config_key' => $validated['config_key']],
            ['config_value' => $validated['config_value'] ?? '']
        );

        return response()->json(['data' => $item]);
    }
}