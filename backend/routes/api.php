<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AssessmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EmergencyController;
use App\Http\Controllers\Api\SurvivorController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'RAPID-MIND Laravel API',
        'timestamp' => now()->toIso8601String(),
        'version' => '1.0.0',
    ]);
});

// Authentication Routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/quick-login', [AuthController::class, 'quickLogin']);
    Route::get('/users', [AuthController::class, 'index']); // Public demo / volunteer selection

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/users', [AuthController::class, 'storeUser']);
        Route::delete('/users/{id}', [AuthController::class, 'deleteUser']);
        Route::patch('/users/{id}/post', [AuthController::class, 'updateUserPost']);
    });
});

// User endpoint standard for Sanctum
Route::get('/user', [AuthController::class, 'me'])->middleware('auth:sanctum');

// Survivors (Victims) Registry
Route::prefix('survivors')->group(function () {
    Route::get('/', [SurvivorController::class, 'index']);
    Route::get('/search', [SurvivorController::class, 'search']);
    Route::get('/{id}', [SurvivorController::class, 'show']);
    Route::post('/', [SurvivorController::class, 'store']);
    Route::patch('/{id}/nik', [SurvivorController::class, 'updateNik']);
});

// Assessments & Triage Scoring Engine
Route::prefix('assessments')->group(function () {
    Route::get('/', [AssessmentController::class, 'index']);
    Route::post('/', [AssessmentController::class, 'store']);
    Route::post('/sync', [AssessmentController::class, 'sync']); // Batch idempotent sync from offline queue
    Route::get('/{recordId}', [AssessmentController::class, 'show']);
});

// Emergency Alerts & Two-Tiered Triage Verification
Route::prefix('emergency')->group(function () {
    Route::get('/', [EmergencyController::class, 'index']);
    Route::post('/', [EmergencyController::class, 'store']);
    Route::get('/{id}', [EmergencyController::class, 'show']);
    Route::post('/{id}/confirm', [EmergencyController::class, 'confirm']);
    Route::post('/{id}/downgrade', [EmergencyController::class, 'downgrade']);
});

// Admin Command Center & Analytics (BPBD / Dinkes)
Route::prefix('admin')->group(function () {
    Route::get('/stats', [AdminController::class, 'stats']);
    Route::get('/longitudinal', [AdminController::class, 'longitudinal']);
    Route::get('/posts', [AdminController::class, 'posts']);
});
