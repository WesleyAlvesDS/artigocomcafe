<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MissionController extends Controller
{
    public function daily(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = now()->toDateString();

        $missions = Mission::daily()->get()->map(function ($mission) use ($user, $today) {
            $userMission = $user->missions()
                ->where('mission_id', $mission->id)
                ->where('assigned_date', $today)
                ->first();

            $mission->progress = $userMission ? $userMission->pivot->progress : 0;
            $mission->target = $mission->conditions['target'] ?? 1;
            $mission->is_completed = $userMission ? (bool) $userMission->pivot->is_completed : false;
            $mission->reward_claimed = $userMission && $userMission->pivot->is_completed;

            return $mission;
        });

        return response()->json(['missions' => $missions]);
    }

    public function progress(Request $request, Mission $mission): JsonResponse
    {
        $user = $request->user();
        $today = now()->toDateString();

        $userMission = $user->missions()
            ->where('mission_id', $mission->id)
            ->where('assigned_date', $today)
            ->first();

        $progress = $userMission ? $userMission->pivot->progress + 1 : 1;
        $target = $mission->conditions['target'] ?? 1;
        $isCompleted = $progress >= $target;

        $user->missions()->syncWithoutDetaching([
            $mission->id => [
                'progress' => $progress,
                'target' => $target,
                'is_completed' => $isCompleted,
                'completed_at' => $isCompleted ? now() : null,
                'assigned_date' => $today,
            ],
        ]);

        return response()->json([
            'progress' => $progress,
            'target' => $target,
            'is_completed' => $isCompleted,
        ]);
    }

    public function claimReward(Request $request, Mission $mission): JsonResponse
    {
        $user = $request->user();
        $today = now()->toDateString();

        $userMission = $user->missions()
            ->where('mission_id', $mission->id)
            ->where('assigned_date', $today)
            ->first();

        if (!$userMission || !$userMission->pivot->is_completed) {
            return response()->json(['message' => 'Missão não concluída.'], 400);
        }

        $alreadyClaimed = $user->grains()
            ->where('source', 'mission_reward')
            ->where('metadata->mission_id', $mission->id)
            ->whereDate('created_at', $today)
            ->exists();

        if ($alreadyClaimed) {
            return response()->json(['message' => 'Recompensa já resgatada.'], 400);
        }

        $user->grains()->create([
            'amount' => $mission->grain_reward,
            'type' => 'earned',
            'source' => 'mission_reward',
            'description' => "Recompensa: {$mission->title}",
            'metadata' => ['mission_id' => $mission->id],
        ]);

        return response()->json(['message' => 'Recompensa resgatada!', 'grains' => $mission->grain_reward]);
    }
}
