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

// Catch-all route for SPA - must be last (exclude /api)
Route::get('/{any}', function () {
    return view('spa');
})->where('any', '^(?!api).*');
