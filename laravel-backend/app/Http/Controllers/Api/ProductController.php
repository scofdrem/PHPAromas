<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Display a listing of products.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query();

        if ($request->has('brand_id')) {
            $query->where('brand_id', $request->brand_id);
        }

        $products = $query->get();

        return response()->json([
            'data' => $products,
        ]);
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'brand' => 'nullable|string|max:255',
            'brand_id' => 'nullable|exists:brands,id',
            'category' => 'nullable|string|max:255',
            'category_id' => 'nullable|exists:categories,id',
            'gender' => 'nullable|string|max:50',
            'age_range' => 'nullable|string|max:50',
            'volumes' => 'nullable|string',
            'image' => 'nullable|string',
            'description' => 'nullable|string',
            'instagram_url' => 'nullable|string',
            'is_new' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
        ]);

        $product = Product::create($validated);

        return response()->json([
            'data' => $product,
            'message' => 'Product created successfully',
        ], 201);
    }

    /**
     * Display the specified product.
     */
    public function show(int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        return response()->json([
            'data' => $product,
        ]);
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'brand' => 'nullable|string|max:255',
            'brand_id' => 'nullable|exists:brands,id',
            'category' => 'nullable|string|max:255',
            'category_id' => 'nullable|exists:categories,id',
            'gender' => 'nullable|string|max:50',
            'age_range' => 'nullable|string|max:50',
            'volumes' => 'nullable|string',
            'image' => 'nullable|string',
            'description' => 'nullable|string',
            'instagram_url' => 'nullable|string',
            'is_new' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
        ]);

        $product->update($validated);

        return response()->json([
            'data' => $product,
            'message' => 'Product updated successfully',
        ]);
    }

    /**
     * Remove the specified product.
     */
    public function destroy(int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json([
            'message' => 'Product deleted successfully',
        ]);
    }
}