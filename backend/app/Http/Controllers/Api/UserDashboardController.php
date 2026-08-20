<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class UserDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $totalGrains = $user->total_grains;
        $articlesRead = $user->articles_read_count;
        $readingTimeHours = (int) ($user->reading_time_total / 60);
        $trailsCompleted = $user->completed_trails_count;
        $achievementsUnlocked = $user->achievements_count;
        $dailyStreak = $user->daily_streak;
        $collectionsCount = $user->collections()->count();
        $categoriesExplored = $user->categories_explored_count;

        return response()->json([
            'evolution' => [
                'total_grains' => $totalGrains,
                'articles_read' => $articlesRead,
                'reading_time_hours' => $readingTimeHours,
                'trails_completed' => $trailsCompleted,
                'achievements_unlocked' => $achievementsUnlocked,
                'daily_streak' => $dailyStreak,
                'collections_count' => $collectionsCount,
                'categories_explored' => $categoriesExplored,
            ],
        ]);
    }

    /**
     * Dados completos da Jornada do leitor: evolução, atividade semanal e
     * progresso por categoria (usado pela seção Jornada do dashboard).
     */
    public function jornada(Request $request): JsonResponse
    {
        $user = $request->user();

        $totalGrains = $user->total_grains;
        $articlesRead = $user->articles_read_count;
        $readingTimeHours = (int) ($user->reading_time_total / 60);
        $trailsCompleted = $user->completed_trails_count;
        $achievementsUnlocked = $user->achievements_count;
        $dailyStreak = $user->daily_streak;
        $collectionsCount = $user->collections()->count();
        $categoriesExplored = $user->categories_explored_count;

        // Atividade dos últimos 7 dias (data no fuso do servidor).
        $since = Carbon::now()->subDays(6)->startOfDay();
        $progress = $user->readingProgress()
            ->where('is_completed', true)
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', $since)
            ->get(['article_id', 'time_spent_seconds', 'completed_at']);

        $byDay = [];
        for ($i = 6; $i >= 0; $i--) {
            $day = Carbon::now()->subDays($i)->toDateString();
            $byDay[$day] = ['articles_read' => 0, 'minutes' => 0];
        }
        foreach ($progress as $row) {
            $day = Carbon::parse($row->completed_at)->toDateString();
            if (!isset($byDay[$day])) continue;
            $byDay[$day]['articles_read']++;
            $byDay[$day]['minutes'] += (int) ceil(($row->time_spent_seconds ?? 0) / 60);
        }
        $weeklyActivity = array_map(
            fn ($date, $v) => ['date' => $date, 'articles_read' => $v['articles_read'], 'minutes' => $v['minutes']],
            array_keys($byDay),
            array_values($byDay)
        );

        // Progresso por categoria (artigos lidos / totais publicados).
        $completedArticleIds = $user->readingProgress()
            ->where('is_completed', true)
            ->pluck('article_id');

        $completedArticles = $completedArticleIds->isEmpty()
            ? collect()
            : Article::whereIn('id', $completedArticleIds)
                ->get(['id', 'category_id']);

        $categoryProgress = Category::where('is_active', true)
            ->orderBy('order')
            ->get()
            ->map(function ($category) use ($completedArticles) {
                $totalArticles = $category->articles()
                    ->where('status', 'published')
                    ->count();
                $articlesRead = $completedArticles->where('category_id', $category->id)->count();

                return [
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'articles_read' => $articlesRead,
                    'total_articles' => $totalArticles,
                    'percent' => $totalArticles > 0
                        ? (int) round(($articlesRead / $totalArticles) * 100)
                        : 0,
                ];
            })
            ->filter(fn ($c) => $c['total_articles'] > 0)
            ->values();

        return response()->json([
            'evolution' => [
                'total_grains' => $totalGrains,
                'articles_read' => $articlesRead,
                'reading_time_hours' => $readingTimeHours,
                'trails_completed' => $trailsCompleted,
                'achievements_unlocked' => $achievementsUnlocked,
                'daily_streak' => $dailyStreak,
                'collections_count' => $collectionsCount,
                'categories_explored' => $categoriesExplored,
            ],
            'weekly_activity' => $weeklyActivity,
            'category_progress' => $categoryProgress,
        ]);
    }
}
