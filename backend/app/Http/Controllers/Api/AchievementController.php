<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AchievementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $userAchievementIds = $user->achievements()->pluck('achievement_id');

        $all = Achievement::visible()->get()->map(function ($achievement) use ($userAchievementIds) {
            $achievement->unlocked = $userAchievementIds->contains($achievement->id);
            return $achievement;
        });

        $unlocked = $all->where('unlocked', true)->values();
        $locked = $all->where('unlocked', false)->values();

        return response()->json([
            'all' => $all,
            'unlocked' => $unlocked,
            'locked' => $locked,
            'total' => $all->count(),
            'unlocked_count' => $unlocked->count(),
        ]);
    }
}
