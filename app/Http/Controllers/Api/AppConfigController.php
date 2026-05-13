<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponseTrait;
use App\Models\AppConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AppConfigController extends Controller
{
    use ApiResponseTrait;

    /**
     * List all app configs (public).
     */
    public function index(): JsonResponse
    {
        $configs = AppConfig::all()->mapWithKeys(function ($config) {
            return [$config->key => $config->value];
        });

        return $this->successResponse(['configs' => $configs]);
    }

    /**
     * Get a specific config by key.
     */
    public function show(string $key): JsonResponse
    {
        $config = AppConfig::where('key', $key)->first();

        if (!$config) {
            return $this->errorResponse('Config not found', 404);
        }

        return $this->successResponse([
            'key' => $config->key,
            'value' => $config->value,
        ]);
    }

    /**
     * Create or update a config.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'key' => ['required', 'string', 'max:255'],
            'value' => ['required'],
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $config = AppConfig::updateOrCreate(
            ['key' => $request->input('key')],
            ['value' => $request->input('value')]
        );

        return $this->successResponse([
            'key' => $config->key,
            'value' => $config->value,
        ], 'Config saved successfully', 201);
    }

    /**
     * Update a config by key.
     */
    public function update(Request $request, string $key): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'value' => ['required'],
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $config = AppConfig::where('key', $key)->first();

        if (!$config) {
            return $this->errorResponse('Config not found', 404);
        }

        $config->update(['value' => $request->input('value')]);

        return $this->successResponse([
            'key' => $config->key,
            'value' => $config->value,
        ], 'Config updated successfully');
    }

    /**
     * Delete a config by key.
     */
    public function destroy(string $key): JsonResponse
    {
        $config = AppConfig::where('key', $key)->first();

        if (!$config) {
            return $this->errorResponse('Config not found', 404);
        }

        $config->delete();

        return $this->successResponse(['message' => 'Config deleted successfully']);
    }
}