<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\InquiryController;
use App\Http\Controllers\Api\SiteContentController;
use App\Http\Controllers\Api\AppConfigController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;

/*
|--------------------------------------------------------------------------
| API Routes - v1 (Matches frontend expectation: /api/v1/...)
|--------------------------------------------------------------------------
*/

// Public entity routes (under /entities prefix as expected by frontend)
Route::prefix('entities')->group(function () {
    // Products
    Route::apiResource('products', ProductController::class);

    // Brands
    Route::apiResource('brands', BrandController::class);

    // Categories
    Route::apiResource('categories', CategoryController::class);

    // Inquiries (only index and store)
    Route::get('inquiries', [InquiryController::class, 'index']);
    Route::post('inquiries', [InquiryController::class, 'store']);

    // Site Content
    Route::get('site_content', [SiteContentController::class, 'index']);
    Route::post('site_content', [SiteContentController::class, 'store']);
    Route::get('site_content/{key}', [SiteContentController::class, 'show']);

    // App Configs
    Route::get('app_configs', [AppConfigController::class, 'index']);
    Route::post('app_configs', [AppConfigController::class, 'store']);
    Route::get('app_configs/{key}', [AppConfigController::class, 'show']);
});

// Auth routes
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

// Admin routes (protected)
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    // Settings management
    Route::get('settings/', [AdminController::class, 'getSettings']);
    Route::get('settings/backend/{key}', [AdminController::class, 'getBackendSetting']);
    Route::get('settings/frontend/{key}', [AdminController::class, 'getFrontendSetting']);
    Route::put('settings/backend/{key}', [AdminController::class, 'updateBackendSetting']);
    Route::put('settings/frontend/{key}', [AdminController::class, 'updateFrontendSetting']);
    Route::post('settings/backend/{key}', [AdminController::class, 'createBackendSetting']);
    Route::post('settings/frontend/{key}', [AdminController::class, 'createFrontendSetting']);
    Route::delete('settings/backend/{key}', [AdminController::class, 'deleteBackendSetting']);
    Route::delete('settings/frontend/{key}', [AdminController::class, 'deleteFrontendSetting']);

    // Users management
    Route::get('users', [AdminController::class, 'getUsers']);
    Route::post('users', [AdminController::class, 'createUser']);
    Route::patch('users/{id}', [AdminController::class, 'updateUserRole']);
    Route::delete('users/{id}', [AdminController::class, 'deleteUser']);

    // Stats
    Route::get('stats', [AdminController::class, 'getStats']);

    // Account management
    Route::get('account', [AdminController::class, 'getAccount']);
    Route::put('account/email', [AdminController::class, 'updateAccountEmail']);
    Route::put('account/name', [AdminController::class, 'updateAccountName']);
    Route::post('account/password', [AdminController::class, 'changePassword']);
    Route::get('account/feedback-email', [AdminController::class, 'getFeedbackEmail']);
    Route::put('account/feedback-email', [AdminController::class, 'updateFeedbackEmail']);

    // SMTP settings
    Route::get('smtp', [AdminController::class, 'getSmtpSettings']);
    Route::put('smtp', [AdminController::class, 'updateSmtpSettings']);

    // Media upload
    Route::post('media', [AdminController::class, 'uploadMedia']);
});