<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponseTrait;
use App\Models\SmtpSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SmtpSettingController extends Controller
{
    use ApiResponseTrait;

    /**
     * Get SMTP settings (admin only).
     */
    public function index(): JsonResponse
    {
        $settings = SmtpSetting::first();

        return $this->successResponse([
            'smtp_setting' => $settings,
        ]);
    }

    /**
     * Store or update SMTP settings (admin only).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'server' => 'required|string|max:255',
            'port' => 'required|integer',
            'email' => 'required|email|max:255',
            'password' => 'nullable|string|max:255',
        ]);

        $settings = SmtpSetting::first();

        if ($settings) {
            $settings->update($validated);
            $message = 'SMTP settings updated successfully';
        } else {
            $settings = SmtpSetting::create($validated);
            $message = 'SMTP settings created successfully';
        }

        return $this->successResponse([
            'smtp_setting' => $settings,
        ], $message);
    }

    /**
     * Test SMTP settings by sending a test email (admin only).
     */
    public function test(Request $request): JsonResponse
    {
        $settings = SmtpSetting::first();

        if (! $settings) {
            return $this->errorResponse('SMTP settings not configured', 400);
        }

        try {
            \Mail::raw('This is a test email from 1000Aroms.', function ($message) use ($settings) {
                $message->to($settings->email)
                       ->subject('SMTP Test');
            });

            return $this->successResponse(null, 'Test email sent successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to send test email: '.$e->getMessage(), 500);
        }
    }
}