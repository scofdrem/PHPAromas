<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inquiry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InquiryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Inquiry::all()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'message' => 'required|string',
            'product_name' => 'nullable|string',
            'product_brand' => 'nullable|string',
        ]);

        $inquiry = Inquiry::create($validated);

        return response()->json([
            'data' => $inquiry,
            'message' => 'Inquiry created successfully',
        ], 201);
    }
}