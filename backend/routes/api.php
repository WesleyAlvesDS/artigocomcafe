<?php

use App\Http\Controllers\Api\AchievementController;
use App\Http\Controllers\Api\ArticleController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CollectionController;
use App\Http\Controllers\Api\GrainController;
use App\Http\Controllers\Api\KnowledgeMapController;
use App\Http\Controllers\Api\MissionController;
use App\Http\Controllers\Api\ReadingProgressController;
use App\Http\Controllers\Api\RecommendationController;
use App\Http\Controllers\Api\TrailController;
use App\Http\Controllers\Api\UserDashboardController;
use Illuminate\Support\Facades\Route;

Route::get('/test', function () {
    return response()->json(['message' => 'API is working', 'version' => '3.0']);
});

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::get('/articles', [ArticleController::class, 'index']);
Route::get('/articles/cafe-do-dia', [ArticleController::class, 'cafeDoDia']);
Route::get('/articles/featured', [ArticleController::class, 'featured']);
Route::get('/articles/popular', [ArticleController::class, 'popular']);
Route::get('/articles/{slug}', [ArticleController::class, 'show']);

Route::get('/categories', [ArticleController::class, 'categories']);

Route::get('/trails', [TrailController::class, 'index']);
Route::get('/trails/{slug}', [TrailController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

    Route::get('/user/dashboard', [UserDashboardController::class, 'index']);

    Route::get('/user/library', [CollectionController::class, 'myLibrary']);
    Route::get('/user/collections', [CollectionController::class, 'index']);
    Route::post('/user/collections', [CollectionController::class, 'store']);
    Route::get('/user/collections/{collection}', [CollectionController::class, 'show']);
    Route::put('/user/collections/{collection}', [CollectionController::class, 'update']);
    Route::delete('/user/collections/{collection}', [CollectionController::class, 'destroy']);
    Route::post('/user/collections/{collection}/articles', [CollectionController::class, 'addArticle']);
    Route::delete('/user/collections/{collection}/articles/{article}', [CollectionController::class, 'removeArticle']);

    Route::get('/user/progress', [ReadingProgressController::class, 'progress']);
    Route::post('/articles/{article}/progress', [ReadingProgressController::class, 'update']);
    Route::post('/articles/{article}/complete', [ReadingProgressController::class, 'complete']);

    Route::get('/user/grains', [GrainController::class, 'index']);

    Route::get('/user/achievements', [AchievementController::class, 'index']);

    Route::get('/user/trails', [TrailController::class, 'myProgress']);
    Route::post('/trails/{trail}/start', [TrailController::class, 'startTrail']);
    Route::post('/trails/{trail}/progress', [TrailController::class, 'updateProgress']);

    Route::get('/user/missions/daily', [MissionController::class, 'daily']);
    Route::post('/missions/{mission}/progress', [MissionController::class, 'progress']);
    Route::post('/missions/{mission}/claim', [MissionController::class, 'claimReward']);

    Route::get('/user/recommendations', [RecommendationController::class, 'recommendations']);
    Route::get('/user/continue-reading', [RecommendationController::class, 'continueReading']);
    Route::get('/user/discover', [RecommendationController::class, 'discover']);

    Route::get('/user/knowledge-map', [KnowledgeMapController::class, 'index']);
});

Route::get('/knowledge-map/categories', [KnowledgeMapController::class, 'publicMap']);
