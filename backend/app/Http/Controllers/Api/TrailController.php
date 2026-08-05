<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Trail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrailController extends Controller
{
    /**
     * Contagens padrão: total e obrigatórios, para artigos e receitas.
     */
    private function withItemCounts($query)
    {
        return $query->withCount([
            'articles as articles_count',
            'articles as required_articles_count' => fn ($q) => $q->where('article_trail.is_required', true),
            'recipes as recipes_count',
            'recipes as required_recipes_count' => fn ($q) => $q->where('trail_recipe.is_required', true),
        ]);
    }

    public function index(): JsonResponse
    {
        $trails = $this->withItemCounts(Trail::active())
            ->get()
            ->map(fn ($trail) => [
                'id' => $trail->id,
                'title' => $trail->title,
                'slug' => $trail->slug,
                'description' => $trail->description,
                'icon' => $trail->icon,
                'color' => $trail->color,
                'difficulty' => $trail->difficulty,
                'estimated_hours' => $trail->estimated_hours,
                'grain_reward' => $trail->grain_reward,
                'articles_count' => (int) $trail->articles_count,
                'recipes_count' => (int) $trail->recipes_count,
                'required_articles_count' => (int) $trail->required_articles_count,
                'required_recipes_count' => (int) $trail->required_recipes_count,
            ]);

        return response()->json(['trails' => $trails]);
    }

    public function show(string $slug): JsonResponse
    {
        $trail = Trail::active()
            ->where('slug', $slug)
            ->with([
                'articles' => function ($q) {
                    $q->published()->with('category:id,name,slug');
                },
                'recipes' => function ($q) {
                    $q->published()->with('category:id,name,slug,icon,color');
                },
            ])
            ->withCount([
                'articles as required_articles_count' => fn ($q) => $q->where('article_trail.is_required', true),
                'recipes as required_recipes_count' => fn ($q) => $q->where('trail_recipe.is_required', true),
            ])
            ->firstOrFail();

        return response()->json(['trail' => $trail]);
    }

    public function myProgress(Request $request): JsonResponse
    {
        $user = $request->user();
        $userTrails = $user->trails()->get()->keyBy('id');

        $trails = $this->withItemCounts(Trail::active())
            ->get()
            ->map(function ($trail) use ($userTrails) {
                $userTrail = $userTrails->get($trail->id);
                $trail->user_progress = $userTrail ? (int) $userTrail->pivot->progress : 0;
                $trail->is_completed = $userTrail ? (bool) $userTrail->pivot->is_completed : false;
                $trail->started_at = $userTrail ? $userTrail->pivot->started_at : null;
                $trail->completed_at = $userTrail ? $userTrail->pivot->completed_at : null;
                $trail->articles_count = (int) $trail->articles_count;
                $trail->recipes_count = (int) $trail->recipes_count;
                $trail->required_articles_count = (int) $trail->required_articles_count;
                $trail->required_recipes_count = (int) $trail->required_recipes_count;
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

        $trail->loadCount([
            'articles as required_articles_count' => fn ($q) => $q->where('article_trail.is_required', true),
            'recipes as required_recipes_count' => fn ($q) => $q->where('trail_recipe.is_required', true),
        ]);

        $trailArticleIds = $trail->articles()->pluck('articles.id');
        $completedArticles = $user->readingProgress()
            ->where('is_completed', true)
            ->whereIn('article_id', $trailArticleIds)
            ->count();

        $trailRecipeIds = $trail->recipes()->pluck('recipes.id');
        $completedRecipes = $user->readingProgress()
            ->where('is_completed', true)
            ->whereIn('recipe_id', $trailRecipeIds)
            ->count();

        $totalRequired = (int) $trail->required_articles_count + (int) $trail->required_recipes_count;
        $completed = $completedArticles + $completedRecipes;
        $progress = $totalRequired > 0 ? min(100, (int) round(($completed / $totalRequired) * 100)) : 0;
        $isCompleted = $totalRequired > 0 && $completed >= $totalRequired;

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
            'completed_items' => $completed,
            'total_required' => $totalRequired,
            'completed_articles' => $completedArticles,
            'completed_recipes' => $completedRecipes,
        ]);
    }
}
