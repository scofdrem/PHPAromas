<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponseTrait;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BrandController extends Controller
{
    use ApiResponseTrait;

    /**
     * Display a listing of brands.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Brand::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%'.$request->search.'%');
        }

        $brands = $query->orderBy('name')->paginate($request->per_page ?? 15);

        return $this->successResponse($this->paginatedResponse($brands, 'brands'));
    }

    /**
     * Display all brands as a simple list (for dropdowns).
     */
    public function list(): JsonResponse
    {
        $brands = Brand::orderBy('name')->get(['id', 'name', 'slug']);

        return $this->successResponse($this->collectionResponse($brands, 'brands'));
    }

    /**
     * Store a newly created brand.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:brands,slug',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $brand = Brand::create($validated);

        return $this->successResponse([
            'brand' => $brand,
        ], 'Brand created successfully', 201);
    }

    /**
     * Display the specified brand.
     */
    public function show(Brand $brand): JsonResponse
    {
        $brand->load('products');

        return $this->successResponse([
            'brand' => $brand,
        ]);
    }

    /**
     * Update the specified brand.
     */
    public function update(Request $request, Brand $brand): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'sometimes|nullable|string|max:255|unique:brands,slug,'.$brand->id,
        ]);

        if (isset($validated['name']) && empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $brand->update($validated);

        return $this->successResponse([
            'brand' => $brand->fresh(),
        ], 'Brand updated successfully');
    }

    /**
     * Remove the specified brand.
     */
    public function destroy(Brand $brand): JsonResponse
    {
        $brand->delete();

        return $this->successResponse(null, 'Brand deleted successfully');
    }
}
