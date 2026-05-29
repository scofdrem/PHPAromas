<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoginActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoginActivityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = LoginActivity::with('user:id,email,first_name,last_name');

        if ($request->has('user_id')) {
            $query->forUser($request->input('user_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('hours')) {
            $query->recent((int) $request->input('hours'));
        }

        $activities = $query->orderBy('login_at', 'desc')
            ->paginate($request->input('per_page', 25));

        return response()->json([
            'data' => $activities,
        ]);
    }

    public function userActivities(Request $request): JsonResponse
    {
        $user = $request->user();

        $activities = LoginActivity::forUser($user->id)
            ->orderBy('login_at', 'desc')
            ->paginate($request->input('per_page', 10));

        return response()->json([
            'data' => $activities,
        ]);
    }
}