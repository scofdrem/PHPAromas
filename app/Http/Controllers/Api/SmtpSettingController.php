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
     * Returns data in keys expected by frontend: smtp_host, smtp_port, smtp_user, smtp_password, email_from, email_to, email_reply_to.
     */
    public function index(): JsonResponse
    {
        $settings = SmtpSetting::first();

        // Normalize field names for frontend (host→smtp_host, username→smtp_user, etc.)
        $data = [
            'smtp_host' => $settings?->host ?? '',
            'smtp_port' => $settings?->port ?? '',
            'smtp_user' => $settings?->username ?? '',
            // Return masked password unless was set (keep existing — don't expose in API reads)
            'smtp_password' => $settings?->password ? str_repeat('*', 10) : '',
            'email_from' => $settings?->from_address ?? '',
            'email_to' => \App\Models\AppConfig::where('key', 'smtp_email_to')->value('value') ?? '',
            'email_reply_to' => \App\Models\AppConfig::where('key', 'smtp_email_reply_to')->value('value') ?? '',
            'email_name' => $settings?->from_name ?? '',
        ];

        return $this->successResponse($data);
    }

    /**
     * Store or update SMTP settings (admin only).
     * Accepts frontend field names: smtp_host, smtp_port, smtp_user, smtp_password, email_from, email_to, email_reply_to.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'smtp_host'   => 'required|string|max:255',
            'smtp_port'   => 'required|integer',
            'smtp_user'   => 'required|string|max:255',
            'smtp_password' => 'nullable|string|max:255',
            'encryption'  => 'nullable|string|max:20',
            'email_from'  => 'nullable|email|max:255',
            'email_name'  => 'nullable|string|max:255',
            'email_to'    => 'nullable|email|max:255',
            'email_reply_to' => 'nullable|email|max:255',
        ]);

        // Map frontend keys to database column names
        $dbData = [
            'host' => $validated['smtp_host'],
            'port' => $validated['smtp_port'],
            'username' => $validated['smtp_user'],
            'encryption' => $validated['encryption'] ?? null,
            'from_address' => $validated['email_from'] ?? null,
            'from_name' => $validated['email_name'] ?? null,
        ];

        // Only update password if provided and not all stars (masked)
        if (! empty($validated['smtp_password']) && $validated['smtp_password'] !== str_repeat('*', 10)) {
            $dbData['password'] = $validated['smtp_password'];
        }

        $settings = SmtpSetting::first();

        if ($settings) {
            $settings->update($dbData);
            $message = 'SMTP settings updated successfully';
        } else {
            $settings = SmtpSetting::create($dbData);
            $message = 'SMTP settings created successfully';
        }

        // Store email_to and email_reply_to in app_configs (not in smtp_settings)
        $this->syncEmailConfig('smtp_email_to', $validated['email_to'] ?? '');
        $this->syncEmailConfig('smtp_email_reply_to', $validated['email_reply_to'] ?? '');

        // Return normalized response matching frontend expectations
        // Do NOT return smtp_password in response to avoid overwriting frontend state
        return $this->successResponse([
            'smtp_host' => $settings->host,
            'smtp_port' => $settings->port,
            'smtp_user' => $settings->username,
            'smtp_password_set' => !empty($settings->password),
            'email_from' => $settings->from_address,
            'email_to' => $validated['email_to'] ?? '',
            'email_reply_to' => $validated['email_reply_to'] ?? '',
            'email_name' => $settings->from_name,
        ], $message);
    }

    /**
     * Update or create SMTP settings (admin only).
     */
    public function update(Request $request): JsonResponse
    {
        return $this->store($request);
    }

    /**
     * Save an email config key to app_configs.
     */
    private function syncEmailConfig(string $key, string $value): void
    {
        if ($value !== '') {
            \App\Models\AppConfig::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }
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
                $message->to($settings->username)
                       ->subject('SMTP Test');
            });

            return $this->successResponse(null, 'Test email sent successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to send test email: '.$e->getMessage(), 500);
        }
    }
}