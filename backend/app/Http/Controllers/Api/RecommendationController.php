<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecommendationController extends Controller
{
    public function recommendations(Request $request): JsonResponse
    {
        $user = $request->user();

        $completedArticleIds = $user->readingProgress()
            ->where('is_completed', true)
            ->pluck('article_id');

        $completedCategoryIds = Article::whereIn('id', $completedArticleIds)
            ->distinct()
            ->pluck('category_id');

        $recommended = Article::published()
            ->with(['category:id,name,slug'])
            ->whereNotIn('id', $completedArticleIds)
            ->where(function ($q) use ($completedCategoryIds) {
                if ($completedCategoryIds->isNotEmpty()) {
                    $q->whereIn('category_id', $completedCategoryIds);
                }
            })
            ->inRandomOrder()
            ->take(6)
            ->get();

        if ($recommended->count() < 6) {
            $existingIds = $recommended->pluck('id');
            $more = Article::published()
                ->with(['category:id,name,slug'])
                ->whereNotIn('id', $existingIds)
                ->inRandomOrder()
                ->take(6 - $recommended->count())
                ->get();
            $recommended = $recommended->concat($more);
        }

        return response()->json(['recommendations' => $recommended]);
    }

    public function continueReading(Request $request): JsonResponse
    {
        $user = $request->user();

        $inProgress = $user->readingProgress()
            ->where('is_completed', false)
            ->where('progress_percent', '>', 0)
            ->with(['article' => function ($q) {
                $q->published()->with('category:id,name,slug');
            }])
            ->orderBy('updated_at', 'desc')
            ->take(10)
            ->get()
            ->filter(fn($p) => $p->article !== null)
            ->values();

        return response()->json(['continue_reading' => $inProgress]);
    }

    public function discover(Request $request): JsonResponse
    {
        $user = $request->user();

        $exploredCategoryIds = $user->readingProgress()
            ->where('is_completed', true)
            ->join('articles', 'reading_progress.article_id', '=', 'articles.id')
            ->distinct()
            ->pluck('articles.category_id');

        $discover = Article::published()
            ->with(['category:id,name,slug'])
            ->whereNotIn('category_id', $exploredCategoryIds)
            ->inRandomOrder()
            ->take(6)
            ->get();

        return response()->json(['discover' => $discover]);
    }
}
