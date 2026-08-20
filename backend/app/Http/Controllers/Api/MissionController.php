<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MissionController extends Controller
{
    /**
     * Verifica se a recompensa da missão já foi resgatada no período vigente.
     * Diárias: hoje. Semanais: a janela da semana corrente.
     */
    private function isRewardClaimed(User $user, Mission $mission): bool
    {
        $query = $user->grains()
            ->where('source', 'mission_reward')
            ->where('metadata->mission_id', $mission->id);

        if ($mission->type === 'weekly') {
            $query->whereBetween('created_at', [
                now()->startOfWeek(),
                now()->endOfWeek(),
            ]);
        } else {
            $query->whereDate('created_at', now()->toDateString());
        }

        return $query->exists();
    }

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
            $mission->reward_claimed = $this->isRewardClaimed($user, $mission);

            return $mission;
        });

        return response()->json(['missions' => $missions]);
    }

    public function weekly(Request $request): JsonResponse
    {
        $user = $request->user();
        $startOfWeek = now()->startOfWeek()->toDateString();
        $endOfWeek = now()->endOfWeek()->toDateString();

        $missions = Mission::weekly()->get()->map(function ($mission) use ($user, $startOfWeek, $endOfWeek) {
            $userMission = $user->missions()
                ->where('mission_id', $mission->id)
                ->whereBetween('assigned_date', [$startOfWeek, $endOfWeek])
                ->first();

            $mission->progress = $userMission ? $userMission->pivot->progress : 0;
            $mission->target = $mission->conditions['target'] ?? 1;
            $mission->is_completed = $userMission ? (bool) $userMission->pivot->is_completed : false;
            $mission->reward_claimed = $this->isRewardClaimed($user, $mission);

            return $mission;
        });

        return response()->json(['missions' => $missions]);
    }

    public function progress(Request $request, Mission $mission): JsonResponse
    {
        $user = $request->user();
        $today = now();

        // Semanais usam o início da semana como assigned_date (igual ao serviço)
        $assignedDate = $mission->type === 'weekly'
            ? $today->copy()->startOfWeek()->toDateString()
            : $today->toDateString();

        $userMission = $user->missions()
            ->where('mission_id', $mission->id)
            ->where('assigned_date', $assignedDate)
            ->first();

        $target = $mission->conditions['target'] ?? 1;
        $progress = min($target, ($userMission ? $userMission->pivot->progress : 0) + 1);
        $isCompleted = $progress >= $target;

        $user->missions()->syncWithoutDetaching([
            $mission->id => [
                'progress' => $progress,
                'target' => $target,
                'is_completed' => $isCompleted,
                'completed_at' => $isCompleted ? now() : null,
                'assigned_date' => $assignedDate,
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
        $today = now();

        // Missões semanais registram o progresso com assigned_date = início da
        // semana; diárias usam o dia atual.
        $assignedDate = $today->toDateString();
        $userMissionQuery = $user->missions()->where('mission_id', $mission->id);

        if ($mission->type === 'weekly') {
            $userMissionQuery->whereBetween('assigned_date', [
                $today->copy()->startOfWeek()->toDateString(),
                $today->copy()->endOfWeek()->toDateString(),
            ]);
        } else {
            $userMissionQuery->where('assigned_date', $assignedDate);
        }

        $userMission = $userMissionQuery->first();

        if (!$userMission || !$userMission->pivot->is_completed) {
            return response()->json(['message' => 'Missão não concluída.'], 400);
        }

        if ($this->isRewardClaimed($user, $mission)) {
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
