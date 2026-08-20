<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Category;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KnowledgeMapController extends Controller
{
    /**
     * Get the full knowledge map data for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get all completed article IDs for this user
        $completedArticleIds = $user->readingProgress()
            ->where('is_completed', true)
            ->pluck('article_id');

        // Get completed articles grouped by category
        $completedArticles = $completedArticleIds->isEmpty()
            ? collect()
            : Article::whereIn('id', $completedArticleIds)
                ->with(['category', 'tags'])
                ->get();

        // Build category tree: categories -> articles -> tags
        $categories = Category::where('is_active', true)
            ->orderBy('order')
            ->get()
            ->map(function ($category) use ($completedArticles, $completedArticleIds) {
                $catArticles = $completedArticles->where('category_id', $category->id);
                $totalArticles = $category->articles()
                    ->where('status', 'published')
                    ->count();

                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'icon' => $category->icon,
                    'color' => $category->color,
                    'total_articles' => $totalArticles,
                    'completed_articles' => $catArticles->count(),
                    'progress_percent' => $totalArticles > 0
                        ? (int) round(($catArticles->count() / $totalArticles) * 100)
                        : 0,
                    'articles' => $catArticles->map(fn($a) => [
                        'id' => $a->id,
                        'title' => $a->title,
                        'slug' => $a->slug,
                        'reading_time' => $a->reading_time,
                        'tags' => $a->tags->map(fn($t) => [
                            'id' => $t->id,
                            'name' => $t->name,
                            'slug' => $t->slug,
                        ]),
                    ])->values(),
                ];
            })
            ->filter(fn($c) => $c['completed_articles'] > 0 || $c['total_articles'] > 0)
            ->values();

        // Get all tags from completed articles (for tag cloud / connections)
        $completedTagIds = $completedArticles->isEmpty()
            ? collect()
            : $completedArticles->pluck('tags')->flatten()->pluck('id')->unique();

        $completedTags = $completedTagIds->isEmpty()
            ? collect()
            : Tag::whereIn('id', $completedTagIds)
                ->withCount(['articles' => fn($q) => $q->whereIn('articles.id', $completedArticleIds)])
                ->get()
                ->map(fn($tag) => [
                    'id' => $tag->id,
                    'name' => $tag->name,
                    'slug' => $tag->slug,
                    'count' => $tag->articles_count,
                ]);

        // Evolution metrics
        $totalGrains = $user->total_grains;
        $articlesRead = $user->articles_read_count;
        $readingTimeHours = (int) ($user->reading_time_total / 60);
        $trailsCompleted = $user->completed_trails_count;
        $achievementsUnlocked = $user->achievements_count;
        $dailyStreak = $user->daily_streak;
        $categoriesExplored = $categories->where('completed_articles', '>', 0)->count();
        $categoriesTotal = $categories->count();

        // Category connections (which categories share tags)
        $connections = [];
        foreach ($categories as $ci) {
            if (count($ci['articles']) === 0) continue;
            $catTagIds = collect($ci['articles'])->pluck('tags')->flatten()->pluck('id')->unique();
            foreach ($categories as $cj) {
                if ($cj['id'] <= $ci['id'] || count($cj['articles']) === 0) continue;
                $otherTagIds = collect($cj['articles'])->pluck('tags')->flatten()->pluck('id')->unique();
                $shared = $catTagIds->intersect($otherTagIds);
                if ($shared->count() > 0) {
                    $connections[] = [
                        'from' => $ci['id'],
                        'to' => $cj['id'],
                        'strength' => min($shared->count(), 5),
                    ];
                }
            }
        }

        return response()->json([
            'categories' => $categories,
            'tags' => $completedTags,
            'connections' => $connections,
            'evolution' => [
                'articles_read' => $articlesRead,
                'reading_time_hours' => $readingTimeHours,
                'trails_completed' => $trailsCompleted,
                'achievements_unlocked' => $achievementsUnlocked,
                'daily_streak' => $dailyStreak,
                'categories_explored' => $categoriesExplored,
                'categories_total' => $categoriesTotal,
                'total_grains' => $totalGrains,
            ],
        ]);
    }

    /**
     * Get all categories with article counts (public, no auth needed).
     */
    public function publicMap(): JsonResponse
    {
        $categories = Category::where('is_active', true)
            ->withCount(['articles' => fn($q) => $q->where('status', 'published')])
            ->orderBy('order')
            ->get()
            ->map(fn($cat) => [
                'id' => $cat->id,
                'name' => $cat->name,
                'slug' => $cat->slug,
                'icon' => $cat->icon,
                'color' => $cat->color,
                'articles_count' => $cat->articles_count,
            ]);

        return response()->json(['categories' => $categories]);
    }
}
