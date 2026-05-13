<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    /**
     * Display a listing of brands.
     */
    public function index(): JsonResponse
    {
        $brands = Brand::all();

        return response()->json([
            'data' => $brands,
        ]);
    }

    /**
     * Store a newly created brand.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:brands,slug',
        ]);

        $brand = Brand::create($validated);

        return response()->json([
            'data' => $brand,
            'message' => 'Brand created successfully',
        ], 201);
    }

    /**
     * Display the specified brand.
     */
    public function show(int $id): JsonResponse
    {
        $brand = Brand::findOrFail($id);

        return response()->json([
            'data' => $brand,
        ]);
    }

    /**
     * Update the specified brand.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $brand = Brand::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:brands,slug,' . $id,
        ]);

        $brand->update($validated);

        return response()->json([
            'data' => $brand,
            'message' => 'Brand updated successfully',
        ]);
    }

    /**
     * Remove the specified brand.
     */
    public function destroy(int $id): JsonResponse
    {
        $brand = Brand::findOrFail($id);
        $brand->delete();

        return response()->json([
            'message' => 'Brand deleted successfully',
        ]);
    }
}