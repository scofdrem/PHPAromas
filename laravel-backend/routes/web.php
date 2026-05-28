<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('spa');
});

// Health check endpoint (for startup script)
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'service' => 'laravel-backend',
        'timestamp' => now()->toISOString(),
    ]);
});

// Public config endpoint for frontend runtime configuration
Route::get('/api/config', function () {
    return response()->json([
        'API_BASE_URL' => config('app.url', 'http://127.0.0.1:8000'),
        'ENV' => config('app.env', 'production'),
    ]);
});

// Catch-all route for SPA - must be last
Route::get('/{any}', function () {
    return view('spa');
})->where('any', '.*');
