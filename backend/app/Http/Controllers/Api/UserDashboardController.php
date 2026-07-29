<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
}
