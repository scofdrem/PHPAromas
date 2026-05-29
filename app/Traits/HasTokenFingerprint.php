<?php

namespace App\Traits;

use Illuminate\Http\Request;

/**
 * Provides JWT fingerprint generation from request data.
 * Used by AuthController to embed device fingerprint into tokens.
 * Uses User-Agent only (not IP) to allow stable sessions across network changes.
 */
trait HasTokenFingerprint
{
    /**
     * Generate a fingerprint hash from the current request's User-Agent.
     * Embedded into JWT as 'fpt' claim for token binding.
     */
    private function generateTokenFingerprint(Request $request): string
    {
        return hash('sha256', $request->userAgent() ?? '');
    }
}