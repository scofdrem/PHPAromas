<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\InquiryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SiteContentController;
use App\Http\Controllers\Api\SmtpSettingController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\StorageController;
use App\Http\Controllers\Api\AppConfigController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// ==================== FRONTEND COMPATIBLE AUTH ROUTES (no v1 prefix) ====================
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    Route::get('me', [AuthController::class, 'me'])->middleware('auth:api');
    Route::post('me', [AuthController::class, 'me'])->middleware('auth:api');
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:api');
    Route::post('refresh', [AuthController::class, 'refresh'])->middleware('auth:api');
});

Route::prefix('v1')->group(function () {

    // ==================== AUTH ROUTES ====================
    Route::prefix('auth')->group(function () {
        // Public auth routes (matching Python backend pattern)
        Route::post('sign-in/email', [AuthController::class, 'signInEmail']);
        Route::post('sign-up/email', [AuthController::class, 'signUpEmail']);
        Route::post('sign-in/username', [AuthController::class, 'signInUsername'])->name('login');
        
        // Legacy endpoints for frontend compatibility
        Route::post('login', [AuthController::class, 'login']);
        Route::post('register', [AuthController::class, 'register']);

        // Protected auth routes
        Route::middleware('auth:api')->group(function () {
            Route::get('me', [AuthController::class, 'me']);
            Route::post('logout', [AuthController::class, 'logout']);
            Route::post('refresh', [AuthController::class, 'refresh']);
        });
    });

    // ==================== ENTITY ROUTES (matching /api/v1/entities/* pattern) ====================
    Route::prefix('entities')->group(function () {

        // Products
        Route::prefix('products')->group(function () {
            // Public routes
            Route::get('/', [ProductController::class, 'index']);
            Route::get('/all', [ProductController::class, 'all']);
            Route::get('/{id}', [ProductController::class, 'show']);

            // Protected routes (admin)
            Route::middleware('auth:api')->group(function () {
                Route::middleware('role:administrator')->group(function () {
                    Route::post('/', [ProductController::class, 'store']);
                    Route::post('/batch', [ProductController::class, 'batchStore']);
                    Route::put('/{id}', [ProductController::class, 'update']);
                    Route::put('/batch', [ProductController::class, 'batchUpdate']);
                    Route::delete('/{id}', [ProductController::class, 'destroy']);
                    Route::delete('/batch', [ProductController::class, 'batchDestroy']);
                });
            });
        });

        // Categories
        Route::prefix('categories')->group(function () {
            // Public routes
            Route::get('/', [CategoryController::class, 'index']);
            Route::get('/{id}', [CategoryController::class, 'show']);

            // Protected routes (admin)
            Route::middleware('auth:api')->group(function () {
                Route::middleware('role:administrator')->group(function () {
                    Route::post('/', [CategoryController::class, 'store']);
                    Route::post('/batch', [CategoryController::class, 'batchStore']);
                    Route::put('/{id}', [CategoryController::class, 'update']);
                    Route::put('/batch', [CategoryController::class, 'batchUpdate']);
                    Route::delete('/{id}', [CategoryController::class, 'destroy']);
                    Route::delete('/batch', [CategoryController::class, 'batchDestroy']);
                });
            });
        });

        // Brands
        Route::prefix('brands')->group(function () {
            // Public routes
            Route::get('/', [BrandController::class, 'index']);
            Route::get('/{id}', [BrandController::class, 'show']);

            // Protected routes (admin)
            Route::middleware('auth:api')->group(function () {
                Route::middleware('role:administrator')->group(function () {
                    Route::post('/', [BrandController::class, 'store']);
                    Route::post('/batch', [BrandController::class, 'batchStore']);
                    Route::put('/{id}', [BrandController::class, 'update']);
                    Route::put('/batch', [BrandController::class, 'batchUpdate']);
                    Route::delete('/{id}', [BrandController::class, 'destroy']);
                    Route::delete('/batch', [BrandController::class, 'batchDestroy']);
                });
            });
        });

        // Inquiries
        Route::prefix('inquiries')->group(function () {
            // Public route for creating inquiries
            Route::post('/', [InquiryController::class, 'store']);

            // Protected routes (admin)
            Route::middleware('auth:api')->group(function () {
                Route::middleware('role:administrator')->group(function () {
                    Route::get('/', [InquiryController::class, 'index']);
                    Route::get('/{id}', [InquiryController::class, 'show']);
                    Route::post('/{id}/reply', [InquiryController::class, 'reply']);
                    Route::delete('/{id}', [InquiryController::class, 'destroy']);
                });
            });
        });

        // Site Content
        Route::prefix('site_content')->group(function () {
            // Public routes
            Route::get('/', [SiteContentController::class, 'index']);
            Route::get('/{key}', [SiteContentController::class, 'show']);

            // Protected routes (admin)
            Route::middleware('auth:api')->group(function () {
                Route::middleware('role:administrator')->group(function () {
                    Route::post('/', [SiteContentController::class, 'store']);
                    Route::post('/batch', [SiteContentController::class, 'batchStore']);
                    Route::put('/{key}', [SiteContentController::class, 'update']);
                    Route::put('/batch', [SiteContentController::class, 'batchUpdate']);
                    Route::delete('/{key}', [SiteContentController::class, 'destroy']);
                    Route::delete('/batch', [SiteContentController::class, 'batchDestroy']);
                });
            });
        });

        // App Configs
        Route::prefix('app_configs')->group(function () {
            // Public routes
            Route::get('/', [AppConfigController::class, 'index']);
            Route::get('/{key}', [AppConfigController::class, 'show']);

            // Protected routes (admin)
            Route::middleware('auth:api')->group(function () {
                Route::middleware('role:administrator')->group(function () {
                    Route::post('/', [AppConfigController::class, 'store']);
                    Route::put('/{key}', [AppConfigController::class, 'update']);
                    Route::delete('/{key}', [AppConfigController::class, 'destroy']);
                });
            });
        });
    });

    // ==================== ADMIN ROUTES ====================
    Route::prefix('admin')->middleware('auth:api')->group(function () {
        Route::middleware('role:administrator')->group(function () {
            // Account management
            Route::get('account', [AdminController::class, 'account']);
            Route::patch('account', [AdminController::class, 'updateAccount']);
            Route::post('account/password', [AdminController::class, 'changePassword']);
            Route::get('account/feedback-email', [AdminController::class, 'feedbackEmail']);
            Route::put('account/feedback-email', [AdminController::class, 'updateFeedbackEmail']);

            // SMTP settings
            Route::get('smtp', [SmtpSettingController::class, 'index']);
            Route::put('smtp', [SmtpSettingController::class, 'update']);

            // User management
            Route::get('users', [AdminController::class, 'users']);
            Route::get('users/{id}', [AdminController::class, 'showUser']);
            Route::post('users', [AdminController::class, 'createUser']);
            Route::patch('users/{id}', [AdminController::class, 'updateUser']);
            Route::delete('users/{id}', [AdminController::class, 'deleteUser']);
        });
    });

    // ==================== STORAGE ROUTES ====================
    Route::prefix('storage')->group(function () {
        Route::post('presign', [StorageController::class, 'presign']);
        Route::post('upload', [StorageController::class, 'upload']);
        Route::get('resolve', [StorageController::class, 'resolve']);
    });


});