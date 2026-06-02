<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponseTrait;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    use ApiResponseTrait;

    /**
     * Display a listing of products.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::with('brand');

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                  ->orWhere('description', 'like', '%'.$request->search.'%');
            });
        }

        if ($request->has('brand_id')) {
            $query->where('brand_id', $request->brand_id);
        }

        if ($request->has('brand_slug')) {
            $query->whereHas('brand', function ($q) use ($request) {
                $q->where('slug', $request->brand_slug);
            });
        }

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('gender')) {
            $query->where('gender', $request->gender);
        }

        if ($request->has('is_new')) {
            $query->where('is_new', true);
        }

        if ($request->has('is_featured')) {
            $query->where('is_featured', true);
        }

        $products = $query->orderBy('created_at', 'desc')
                         ->paginate($request->per_page ?? 15);

        return $this->successResponse(['products' => $products]);
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'brand_id' => 'required|exists:brands,id',
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'gender' => 'nullable|string|max:255',
            'age_range' => 'nullable|string|max:255',
            'volumes' => 'nullable|string|max:255',
            'image' => 'nullable|image|max:2048',
            'description' => 'nullable|string',
            'instagram_url' => 'nullable|url|max:255',
            'is_new' => 'boolean',
            'is_featured' => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('products', 'public');
        }

        $product = Product::create($validated);

        return $this->successResponse([
            'product' => $product->load('brand'),
        ], 'Product created successfully', 201);
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product): JsonResponse
    {
        $product->load('brand');

        return $this->successResponse([
            'product' => $product,
        ]);
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'brand_id' => 'sometimes|required|exists:brands,id',
            'name' => 'sometimes|required|string|max:255',
            'category' => 'nullable|string|max:255',
            'gender' => 'nullable|string|max:255',
            'age_range' => 'nullable|string|max:255',
            'volumes' => 'nullable|string|max:255',
            'image' => 'nullable|image|max:2048',
            'description' => 'nullable|string',
            'instagram_url' => 'nullable|url|max:255',
            'is_new' => 'boolean',
            'is_featured' => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            // Delete old image
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $validated['image'] = $request->file('image')->store('products', 'public');
        }

        $product->update($validated);

        return $this->successResponse([
            'product' => $product->fresh()->load('brand'),
        ], 'Product updated successfully');
    }

    /**
     * Remove the specified product.
     */
    public function destroy(Product $product): JsonResponse
    {
        // Delete image
        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }

        $product->delete();

        return $this->successResponse(null, 'Product deleted successfully');
    }
}
