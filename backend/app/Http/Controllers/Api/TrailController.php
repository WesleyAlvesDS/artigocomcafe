<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Trail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrailController extends Controller
{
    public function index(): JsonResponse
    {
        $trails = Trail::active()
            ->withCount(['articles'])
            ->get()
            ->map(fn($trail) => [
                'id' => $trail->id,
                'title' => $trail->title,
                'slug' => $trail->slug,
                'description' => $trail->description,
                'icon' => $trail->icon,
                'color' => $trail->color,
                'difficulty' => $trail->difficulty,
                'estimated_hours' => $trail->estimated_hours,
                'grain_reward' => $trail->grain_reward,
                'articles_count' => $trail->articles_count,
            ]);

        return response()->json(['trails' => $trails]);
    }

    public function show(string $slug): JsonResponse
    {
        $trail = Trail::active()
            ->where('slug', $slug)
            ->with(['articles' => function ($q) {
                $q->published()->with('category:id,name,slug');
            }])
            ->firstOrFail();

        return response()->json(['trail' => $trail]);
    }

    public function myProgress(Request $request): JsonResponse
    {
        $user = $request->user();
        $trails = Trail::active()
            ->withCount('articles')
            ->get()
            ->map(function ($trail) use ($user) {
                $userTrail = $user->trails()->where('trail_id', $trail->id)->first();
                $trail->user_progress = $userTrail ? $userTrail->pivot->progress : 0;
                $trail->is_completed = $userTrail ? (bool) $userTrail->pivot->is_completed : false;
                $trail->started_at = $userTrail ? $userTrail->pivot->started_at : null;
                $trail->completed_at = $userTrail ? $userTrail->pivot->completed_at : null;
                return $trail;
            });

        return response()->json(['trails' => $trails]);
    }

    public function startTrail(Request $request, Trail $trail): JsonResponse
    {
        $user = $request->user();

        $user->trails()->syncWithoutDetaching([
            $trail->id => ['started_at' => now(), 'progress' => 0],
        ]);

        return response()->json(['message' => 'Trilha iniciada!']);
    }

    public function updateProgress(Request $request, Trail $trail): JsonResponse
    {
        $user = $request->user();

        $completedArticles = $user->readingProgress()
            ->where('is_completed', true)
            ->whereIn('article_id', $trail->articles()->pluck('articles.id'))
            ->count();

        $totalRequired = $trail->required_articles_count;
        $progress = $totalRequired > 0 ? min(100, (int) ($completedArticles / $totalRequired * 100)) : 0;
        $isCompleted = $completedArticles >= $totalRequired;

        $user->trails()->syncWithoutDetaching([
            $trail->id => [
                'progress' => $progress,
                'is_completed' => $isCompleted,
                'completed_at' => $isCompleted ? now() : null,
            ],
        ]);

        return response()->json([
            'progress' => $progress,
            'is_completed' => $isCompleted,
        ]);
    }
}
