<?php

namespace App\Filament\User\Widgets;

use Filament\Widgets\Widget;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class GamificationWidget extends Widget
{
    protected static ?int $sort = 10;
    protected string $view = 'filament.user.widgets.gamification-widget';

    /**
     * TTL do cache em segundos (5 minutos).
     * Widgets de gamificação mudam frequentemente mas não precisa ser real-time.
     */
    protected int $cacheTtl = 300;

    public function getViewData(): array
    {
        $user = Auth::user();

        if (! $user) {
            return $this->emptyState();
        }

        // Cache por usuário para evitar queries repetidas
        $cacheKey = "widget.gamification.{$user->id}";

        return Cache::remember($cacheKey, $this->cacheTtl, function () use ($user) {
            return $this->buildData($user);
        });
    }

    protected function buildData($user): array
    {
        $totalGrains = $user->total_grains;
        $level = min(10, 1 + (int) floor($totalGrains / 300));
        $levelProgress = (($totalGrains % 300) / 300) * 100;

        // Missões do dia (via relationship existente)
        $dailyMissions = $user->missions()
            ->where('type', 'daily')
            ->wherePivot('assigned_date', now()->toDateString())
            ->get();

        $missionsCompleted = $dailyMissions->filter(fn ($m) => $m->pivot->is_completed)->count();
        $missionsTotal = max(1, $dailyMissions->count());

        // Próxima missão ativa
        $activeMission = $dailyMissions->firstWhere('pivot.is_completed', false);

        return [
            'totalGrains' => $totalGrains,
            'level' => $level,
            'levelProgress' => $levelProgress,
            'levelName' => $this->getLevelName($level),
            'dailyStreak' => $user->daily_streak,
            'articlesRead' => $user->articles_read_count,
            'missionsCompleted' => $missionsCompleted,
            'missionsTotal' => $missionsTotal,
            'trailsCompleted' => $user->completed_trails_count,
            'achievementsUnlocked' => $user->achievements_count,
            'activeMission' => $activeMission ? [
                'title' => $activeMission->title,
                'progress' => $activeMission->pivot->progress,
                'target' => $activeMission->pivot->target,
                'percent' => $activeMission->pivot->target > 0
                    ? round(($activeMission->pivot->progress / $activeMission->pivot->target) * 100)
                    : 0,
                'reward' => $activeMission->grain_reward,
            ] : null,
        ];
    }

    /**
     * Limpa o cache do widget (chamado quando o usuário completa ações).
     */
    public static function clearCache(int $userId): void
    {
        Cache::forget("widget.gamification.{$userId}");
    }

    private function emptyState(): array
    {
        return [
            'totalGrains' => 0,
            'level' => 1,
            'levelProgress' => 0,
            'levelName' => 'Aprendiz',
            'dailyStreak' => 0,
            'articlesRead' => 0,
            'missionsCompleted' => 0,
            'missionsTotal' => 0,
            'trailsCompleted' => 0,
            'achievementsUnlocked' => 0,
            'activeMission' => null,
        ];
    }

    private function getLevelName(int $level): string
    {
        return match(true) {
            $level >= 10 => 'Mestre Barista',
            $level >= 8 => 'Barista Expert',
            $level >= 6 => 'Barista Pleno',
            $level >= 4 => 'Barista Intermediário',
            $level >= 2 => 'Barista Iniciante',
            default => 'Aprendiz',
        };
    }
}
