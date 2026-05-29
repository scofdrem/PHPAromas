<?php

namespace App\Services;

use App\Models\LoginActivity;
use App\Models\User;
use Illuminate\Http\Request;

class LoginActivityService
{
    public function recordSuccess(Request $request, User $user): LoginActivity
    {
        return LoginActivity::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'status' => 'success',
            'failure_reason' => null,
            'login_at' => now(),
        ]);
    }

    public function recordFailure(Request $request, ?User $user, string $reason): LoginActivity
    {
        return LoginActivity::create([
            'user_id' => $user?->id,
            'email' => $request->input('email'),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'status' => 'failed',
            'failure_reason' => $reason,
            'login_at' => now(),
        ]);
    }
}