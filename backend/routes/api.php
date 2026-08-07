<?php

use App\Http\Controllers\Api\AchievementController;
use App\Http\Controllers\Api\AiAssistantController;
use App\Http\Controllers\Api\ArticleController;
use App\Http\Controllers\Api\IntegrationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CollectionController;
use App\Http\Controllers\Api\GrainController;
use App\Http\Controllers\Api\KnowledgeMapController;
use App\Http\Controllers\Api\MissionController;
use App\Http\Controllers\Api\ReadingProgressController;
use App\Http\Controllers\Api\RecommendationController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Api\PushSubscriptionController;
use App\Http\Controllers\Api\RoasteryController;
use App\Http\Controllers\Api\ThemeController;
use App\Http\Controllers\Api\TrailController;
use App\Http\Controllers\Api\UserDashboardController;
use Illuminate\Support\Facades\Route;

Route::get('/test', function () {
    return response()->json(['message' => 'API is working', 'version' => '3.0']);
});

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

Route::get('/articles', [ArticleController::class, 'index']);
Route::get('/articles/cafe-do-dia', [ArticleController::class, 'cafeDoDia']);
Route::get('/articles/featured', [ArticleController::class, 'featured']);
Route::get('/articles/popular', [ArticleController::class, 'popular']);
Route::get('/articles/{slug}', [ArticleController::class, 'show']);

Route::get('/categories', [ArticleController::class, 'categories']);

// Receitas (Fase 6 - receitas.md)
Route::get('/recipes', [RecipeController::class, 'index']);
Route::get('/recipes/cafe-do-dia', [RecipeController::class, 'cafeDoDia']);
Route::get('/recipes/featured', [RecipeController::class, 'featured']);
Route::get('/recipes/{slug}', [RecipeController::class, 'show']);
Route::get('/recipe-categories', [RecipeController::class, 'categories']);

Route::get('/trails', [TrailController::class, 'index']);
Route::get('/trails/{slug}', [TrailController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

    Route::get('/user/dashboard', [UserDashboardController::class, 'index']);

    Route::get('/user/library', [CollectionController::class, 'myLibrary']);
    Route::get('/user/library/recipes', [CollectionController::class, 'myRecipeLibrary']);
    Route::post('/user/library/{article}', [CollectionController::class, 'saveToLibrary']);
    Route::post('/user/library/recipe/{recipe}', [CollectionController::class, 'saveRecipeToLibrary']);
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

    // Progresso e conclusão de leitura de receitas (Fase 6 - receitas.md)
    Route::post('/recipes/{recipe}/progress', [ReadingProgressController::class, 'updateRecipe']);
    Route::post('/recipes/{recipe}/complete', [ReadingProgressController::class, 'completeRecipe']);

    Route::get('/user/grains', [GrainController::class, 'index']);

    Route::get('/user/achievements', [AchievementController::class, 'index']);

    Route::get('/user/trails', [TrailController::class, 'myProgress']);
    Route::post('/trails/{trail}/start', [TrailController::class, 'startTrail']);
    Route::post('/trails/{trail}/progress', [TrailController::class, 'updateProgress']);

    Route::get('/user/missions/daily', [MissionController::class, 'daily']);
    Route::get('/user/missions/weekly', [MissionController::class, 'weekly']);
    Route::post('/missions/{mission}/progress', [MissionController::class, 'progress']);
    Route::post('/missions/{mission}/claim', [MissionController::class, 'claimReward']);

    Route::get('/user/recommendations', [RecommendationController::class, 'recommendations']);
    Route::get('/user/continue-reading', [RecommendationController::class, 'continueReading']);
    Route::get('/user/discover', [RecommendationController::class, 'discover']);

    Route::get('/user/knowledge-map', [KnowledgeMapController::class, 'index']);

    Route::get('/user/rewards', [RoasteryController::class, 'index']);
    Route::post('/user/rewards/{reward}/roast', [RoasteryController::class, 'roast']);
    Route::post('/user/rewards/{reward}/toggle', [RoasteryController::class, 'toggle']);
    Route::get('/user/rewards/active-theme', [RoasteryController::class, 'activeTheme']);

    Route::post('/user/push-subscription', [PushSubscriptionController::class, 'subscribe']);
    Route::delete('/user/push-subscription', [PushSubscriptionController::class, 'unsubscribe']);
    Route::get('/user/push-subscription/status', [PushSubscriptionController::class, 'status']);
});

Route::get('/knowledge-map/categories', [KnowledgeMapController::class, 'publicMap']);

Route::get('/themes', [ThemeController::class, 'index']);

// Integrações de API externas (Fase 6 - planoapi.md)
// Rate limit para não estourar as cotas gratuitas das APIs externas.
Route::prefix('integrations')->middleware('throttle:30,1')->group(function () {
    Route::get('/headlines', [IntegrationController::class, 'headlines']);
    Route::get('/weather', [IntegrationController::class, 'weather']);
    Route::get('/exchange', [IntegrationController::class, 'exchange']);
});

// Assistente do Criador — AI (Groq + Gemini)
// Rate limit para proteger as cotas gratuitas.
Route::prefix('ai')->middleware('throttle:10,1')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/ask', [AiAssistantController::class, 'ask']);
    });
    Route::get('/status', [AiAssistantController::class, 'status']);
});
