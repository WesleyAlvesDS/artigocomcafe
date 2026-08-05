<?php

namespace App\Services;

use App\Models\DailyVisit;
use App\Models\Grain;
use App\Models\Mission;
use App\Models\ReadingProgress;
use App\Models\Recipe;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Centraliza a lógica de gamificação reutilizável entre conteúdo
 * (artigos e receitas) — grãos, contadores diários e missões por ação.
 */
class GamificationService
{
    /**
     * Conclui a leitura de uma receita: marca o progresso, concede grãos,
     * atualiza o total do usuário e o registro diário de visitas, e
     * dispara o progresso das missões com action = "read_recipe".
     */
    public function completeRecipe(User $user, Recipe $recipe, ReadingProgress $progress): void
    {
        DB::transaction(function () use ($user, $recipe, $progress) {
            $progress->update([
                'is_completed' => true,
                'progress_percent' => 100,
                'completed_at' => now(),
            ]);

            $readingTimeMinutes = max(1, (int) ceil($progress->time_spent_seconds / 60));
            $grainAmount = $readingTimeMinutes >= 5 ? 5 : 1;

            $user->increment('articles_read_count');
            $user->increment('reading_time_total', $readingTimeMinutes);

            Grain::create([
                'user_id' => $user->id,
                'amount' => $grainAmount,
                'type' => 'earned',
                'source' => 'read_recipe',
                'description' => "Receita concluída: {$recipe->title}",
                'metadata' => ['recipe_id' => $recipe->id],
            ]);

            $dailyVisit = DailyVisit::firstOrCreate(
                ['user_id' => $user->id, 'visit_date' => now()->toDateString()],
                ['articles_read' => 0, 'time_spent_minutes' => 0, 'grains_earned' => 0]
            );

            $dailyVisit->increment('articles_read');
            $dailyVisit->increment('time_spent_minutes', $readingTimeMinutes);
            $dailyVisit->increment('grains_earned', $grainAmount);

            $this->registerMissionProgress($user, 'read_recipe');
        });
    }

    /**
     * Incrementa o progresso das missões ativas cuja condição de action
     * corresponde à ação executada (ex.: "read_recipe").
     *
     * Missões diárias usam assigned_date = hoje; semanais usam o início
     * da semana, garantindo uma linha por período e evitando progresso
     * duplicado na mesma janela.
     */
    public function registerMissionProgress(User $user, string $action, int $amount = 1): void
    {
        // Filtra em PHP (em vez de JSON_EXTRACT) para manter compatibilidade
        // com MySQL/MariaDB e SQLite nos testes.
        $missions = Mission::where('is_active', true)
            ->get()
            ->filter(fn (Mission $mission) => ($mission->conditions['action'] ?? null) === $action);

        foreach ($missions as $mission) {
            $today = now();
            $assignedDate = $mission->type === 'weekly'
                ? $today->copy()->startOfWeek()->toDateString()
                : $today->toDateString();

            $userMission = $user->missions()
                ->where('mission_id', $mission->id)
                ->where('assigned_date', $assignedDate)
                ->first();

            $progress = $userMission ? (int) $userMission->pivot->progress : 0;
            $target = $mission->conditions['target'] ?? 1;
            $newProgress = min($target, $progress + $amount);
            $isCompleted = $newProgress >= $target;

            $user->missions()->syncWithoutDetaching([
                $mission->id => [
                    'progress' => $newProgress,
                    'target' => $target,
                    'is_completed' => $isCompleted,
                    'completed_at' => $isCompleted ? now() : null,
                    'assigned_date' => $assignedDate,
                ],
            ]);
        }
    }
}
