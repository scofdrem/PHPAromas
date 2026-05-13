<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponseTrait;
use App\Models\Inquiry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class InquiryController extends Controller
{
    use ApiResponseTrait;

    /**
     * Display a listing of inquiries (admin only).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Inquiry::with('replier');

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                  ->orWhere('email', 'like', '%'.$request->search.'%')
                  ->orWhere('message', 'like', '%'.$request->search.'%');
            });
        }

        $inquiries = $query->orderBy('created_at', 'desc')
                          ->paginate($request->per_page ?? 15);

        return $this->successResponse($this->paginatedResponse($inquiries, 'inquiries'));
    }

    /**
     * Store a newly created inquiry (public endpoint).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:255',
            'message' => 'nullable|string',
            'product_name' => 'nullable|string|max:255',
            'product_brand' => 'nullable|string|max:255',
        ]);

        $inquiry = Inquiry::create($validated);

        return $this->successResponse([
            'inquiry' => $inquiry,
        ], 'Inquiry submitted successfully', 201);
    }

    /**
     * Display the specified inquiry.
     */
    public function show(Inquiry $inquiry): JsonResponse
    {
        $inquiry->load('replier');

        return $this->successResponse([
            'inquiry' => $inquiry,
        ]);
    }

    /**
     * Reply to an inquiry (admin only).
     */
    public function reply(Request $request, Inquiry $inquiry): JsonResponse
    {
        $validated = $request->validate([
            'reply' => 'required|string',
        ]);

        $inquiry->update([
            'reply' => $validated['reply'],
            'replied_at' => now(),
            'replied_by' => $request->user()->id,
        ]);

        // Send email reply
        try {
            Mail::raw($validated['reply'], function ($message) use ($inquiry) {
                $message->to($inquiry->email)
                       ->subject('Re: Your inquiry at 1000Aroms');
            });
        } catch (\Exception $e) {
            // Log error but don't fail the reply
            \Log::error('Failed to send reply email: '.$e->getMessage());
        }

        return $this->successResponse([
            'inquiry' => $inquiry->fresh()->load('replier'),
        ], 'Reply sent successfully');
    }

    /**
     * Remove the specified inquiry.
     */
    public function destroy(Inquiry $inquiry): JsonResponse
    {
        $inquiry->delete();

        return $this->successResponse(null, 'Inquiry deleted successfully');
    }
}