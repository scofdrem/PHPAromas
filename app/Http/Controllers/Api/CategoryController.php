<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponseTrait;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

final class CategoryController extends Controller
{
    use ApiResponseTrait;

    public function index(): JsonResponse
    {
        $categories = Category::all();

        return $this->successResponse($this->collectionResponse($categories, 'categories'));
    }

    public function show(Category $category): JsonResponse
    {
        return $this->successResponse([
            'category' => $category,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:categories,slug',
            'image' => 'nullable|string|max:500',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $category = Category::create($validated);

        return $this->successResponse([
            'category' => $category,
        ], 'Category created successfully', 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:categories,slug,' . $category->id,
            'image' => 'nullable|string|max:500',
        ]);

        if (isset($validated['name']) && empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $category->update($validated);

        return $this->successResponse([
            'category' => $category->fresh(),
        ], 'Category updated successfully');
    }

    public function destroy(Category $category): JsonResponse
    {
        $category->delete();

        return $this->successResponse(null, 'Category deleted successfully');
    }
}