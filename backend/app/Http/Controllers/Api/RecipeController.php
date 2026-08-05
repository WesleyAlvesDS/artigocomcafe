<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Recipe;
use App\Models\RecipeCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecipeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Recipe::published()
            ->with(['category:id,name,slug,icon,color', 'tags:id,name,slug']);

        if ($request->category) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->category));
        }

        if ($request->tag) {
            $query->whereHas('tags', fn ($q) => $q->where('slug', $request->tag));
        }

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('excerpt', 'like', "%{$search}%");
            });
        }

        if ($request->featured) {
            $query->featured();
        }

        $sortField = match ($request->sort) {
            'popular' => 'views_count',
            'oldest' => 'published_at',
            default => 'published_at',
        };
        $sortDir = $request->sort === 'oldest' ? 'asc' : 'desc';

        $recipes = $query->orderBy($sortField, $sortDir)
            ->paginate($request->per_page ?? 12);

        return response()->json($recipes);
    }

    public function show(string $slug): JsonResponse
    {
        $recipe = Recipe::published()
            ->with(['category', 'tags', 'author:id,name,username,avatar'])
            ->where('slug', $slug)
            ->firstOrFail();

        $recipe->increment('views_count');

        // Relacionadas: mesma categoria primeiro, depois as mais recentes
        $related = Recipe::published()
            ->with('category:id,name,slug,icon,color')
            ->where('id', '!=', $recipe->id)
            ->where('category_id', $recipe->category_id)
            ->orderBy('published_at', 'desc')
            ->limit(4)
            ->get(['id', 'title', 'slug', 'excerpt', 'cover_image', 'prep_time_minutes', 'difficulty', 'published_at', 'category_id']);

        if ($related->count() < 4) {
            $existingIds = $related->pluck('id')->push($recipe->id);
            $recent = Recipe::published()
                ->with('category:id,name,slug,icon,color')
                ->whereNotIn('id', $existingIds)
                ->orderBy('published_at', 'desc')
                ->limit(4 - $related->count())
                ->get(['id', 'title', 'slug', 'excerpt', 'cover_image', 'prep_time_minutes', 'difficulty', 'published_at', 'category_id']);
            $related = $related->concat($recent);
        }

        return response()->json([
            'recipe' => $recipe,
            'related' => $related,
        ]);
    }

    public function cafeDoDia(): JsonResponse
    {
        $recipe = Recipe::published()
            ->with(['category', 'tags'])
            ->cafeDoDia()
            ->inRandomOrder()
            ->first();

        if (! $recipe) {
            $recipe = Recipe::published()
                ->with(['category', 'tags'])
                ->inRandomOrder()
                ->first();
        }

        return response()->json(['recipe' => $recipe]);
    }

    public function featured(): JsonResponse
    {
        $recipes = Recipe::published()
            ->with(['category:id,name,slug,icon,color'])
            ->featured()
            ->orderBy('published_at', 'desc')
            ->take(6)
            ->get();

        return response()->json(['recipes' => $recipes]);
    }

    public function categories(): JsonResponse
    {
        $categories = RecipeCategory::where('is_active', true)
            ->withCount(['recipes' => fn ($q) => $q->where('status', 'published')])
            ->orderBy('order')
            ->get();

        return response()->json(['categories' => $categories]);
    }
}
