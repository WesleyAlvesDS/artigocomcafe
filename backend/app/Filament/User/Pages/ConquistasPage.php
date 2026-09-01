<?php

namespace App\Filament\User\Pages;

use App\Models\Achievement;
use Filament\Pages\Page;
use Illuminate\Support\Facades\Auth;
use BackedEnum;
use UnitEnum;

class ConquistasPage extends Page
{
    protected string $view = 'filament.user.conquistas-page';

    protected static ?string $title = 'Conquistas';

    protected static BackedEnum|string|null $navigationIcon = 'heroicon-o-trophy';

    protected static ?string $navigationLabel = 'Conquistas';

    protected static ?int $navigationSort = 5;

    protected static string|UnitEnum|null $navigationGroup = 'Explorar';

    protected static ?string $slug = 'conquistas';

    public array $allAchievements = [];
    public array $unlockedAchievements = [];
    public array $lockedAchievements = [];
    public array $milestones = [];
    public int $totalUnlocked = 0;
    public int $totalAvailable = 0;
    public float $completionPercent = 0;
    public string $activeTab = 'all';


    public function mount(): void
    {
        $user = Auth::user();
        if (! $user) {
            return;
        }

        $this->loadAchievements($user);
        $this->loadMilestones($user);
    }

    protected function loadAchievements($user): void
    {
        $userAchievementIds = $user->achievements()->pluck('achievement_id');

        $achievements = Achievement::visible()
            ->get()
            ->map(function ($achievement) use ($userAchievementIds) {
                $isUnlocked = $userAchievementIds->contains($achievement->id);

                return [
                    'id' => $achievement->id,
                    'name' => $achievement->name,
                    'slug' => $achievement->slug,
                    'description' => $achievement->description,
                    'icon' => $achievement->icon ?? '🏆',
                    'category' => $achievement->category ?? 'Geral',
                    'rarity' => $achievement->rarity ?? 'common',
                    'grain_reward' => $achievement->grain_reward ?? 0,
                    'is_unlocked' => $isUnlocked,
                    'earned_at' => $isUnlocked
                        ? $user->achievements()->where('achievement_id', $achievement->id)->first()?->pivot?->earned_at?->diffForHumans()
                        : null,
                ];
            })
            ->toArray();

        $this->allAchievements = $achievements;
        $this->unlockedAchievements = array_values(array_filter($achievements, fn ($a) => $a['is_unlocked']));
        $this->lockedAchievements = array_values(array_filter($achievements, fn ($a) => ! $a['is_unlocked']));

        $this->totalUnlocked = count($this->unlockedAchievements);
        $this->totalAvailable = count($achievements);
        $this->completionPercent = $this->totalAvailable > 0
            ? round(($this->totalUnlocked / $this->totalAvailable) * 100)
            : 0;
    }

    protected function loadMilestones($user): void
    {
        $this->milestones = [
            [
                'title' => 'Primeiro Artigo',
                'description' => 'Leia seu primeiro artigo completo',
                'icon' => '📖',
                'current' => $user->articles_read_count,
                'target' => 1,
                'completed' => $user->articles_read_count >= 1,
            ],
            [
                'title' => 'Leitor Ávido',
                'description' => 'Leia 10 artigos',
                'icon' => '📚',
                'current' => $user->articles_read_count,
                'target' => 10,
                'completed' => $user->articles_read_count >= 10,
            ],
            [
                'title' => 'Mestre da Leitura',
                'description' => 'Leia 50 artigos',
                'icon' => '🎓',
                'current' => $user->articles_read_count,
                'target' => 50,
                'completed' => $user->articles_read_count >= 50,
            ],
            [
                'title' => 'Foguete 🔥',
                'description' => 'Mantenha 7 dias seguidos',
                'icon' => '🔥',
                'current' => $user->daily_streak,
                'target' => 7,
                'completed' => $user->daily_streak >= 7,
            ],
            [
                'title' => 'Inabalável',
                'description' => 'Mantenha 30 dias seguidos',
                'icon' => '💪',
                'current' => $user->daily_streak,
                'target' => 30,
                'completed' => $user->daily_streak >= 30,
            ],
            [
                'title' => 'Colecionador',
                'description' => 'Salve 20 artigos',
                'icon' => '🔖',
                'current' => $user->collections()->count(),
                'target' => 20,
                'completed' => $user->collections()->count() >= 20,
            ],
            [
                'title' => 'Explorador',
                'description' => 'Explore 5 categorias diferentes',
                'icon' => '🗺️',
                'current' => $user->categories_explored_count,
                'target' => 5,
                'completed' => $user->categories_explored_count >= 5,
            ],
            [
                'title' => 'Café特浓',
                'description' => 'Acumule 1000 grãos',
                'icon' => '☕',
                'current' => $user->total_grains,
                'target' => 1000,
                'completed' => $user->total_grains >= 1000,
            ],
        ];
    }
}
