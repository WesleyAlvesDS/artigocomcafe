<?php

namespace App\Services;

use App\Models\Article;
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
     * Registra o progresso da missão de leitura de um ARTIGO.
     *
     * Além da ação "read_article", também atualiza as missões por
     * categorias distintas ("read_categories" diária e "explore_category"
     * semanal), contando quantas categorias diferentes o usuário leu no
     * período vigente de cada missão.
     */
    public function registerReadArticle(User $user): void
    {
        $this->registerMissionProgress($user, 'read_article');
        $this->registerCategoryProgress($user);
    }

    /**
     * Atualiza as missões baseadas em categorias distintas lidas no período
     * ("read_categories" diária e "explore_category" semanal).
     *
     * O progresso é a quantidade de categorias DIFERENTES de artigos que o
     * usuário completou dentro da janela da missão (hoje ou a semana atual),
     * em vez de simplesmente incrementar por artigo lido — evita contagem
     * dupla quando vários artigos da mesma categoria são lidos.
     */
    public function registerCategoryProgress(User $user): void
    {
        $missions = Mission::where('is_active', true)
            ->get()
            ->filter(fn (Mission $mission) => in_array(
                $mission->conditions['action'] ?? null,
                ['read_categories', 'explore_category'],
                true
            ));

        foreach ($missions as $mission) {
            $today = now();
            $startOfWindow = $mission->type === 'weekly'
                ? $today->copy()->startOfWeek()
                : $today->copy()->startOfDay();
            $endOfWindow = $mission->type === 'weekly'
                ? $today->copy()->endOfWeek()
                : $today->copy()->endOfDay();
            $assignedDate = $mission->type === 'weekly'
                ? $startOfWindow->toDateString()
                : $today->toDateString();

            $distinctCategories = ReadingProgress::where('user_id', $user->id)
                ->where('is_completed', true)
                ->whereNotNull('completed_at')
                ->whereBetween('completed_at', [$startOfWindow, $endOfWindow])
                ->with('article:id,category_id')
                ->get()
                ->pluck('article.category_id')
                ->filter()
                ->unique()
                ->count();

            $target = $mission->conditions['target'] ?? 1;
            $newProgress = min($target, $distinctCategories);
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

    /**
     * Registra o progresso da missão "save_article" (Salvador de Ideias).
     */
    public function registerSaveArticle(User $user): void
    {
        $this->registerMissionProgress($user, 'save_article');
    }

    /**
     * Registra o progresso da missão "create_collection" (Colecionador Semanal).
     */
    public function registerCreateCollection(User $user): void
    {
        $this->registerMissionProgress($user, 'create_collection');
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
