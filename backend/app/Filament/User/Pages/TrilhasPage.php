<?php

namespace App\Filament\User\Pages;

use App\Models\Trail;
use Filament\Pages\Page;
use Illuminate\Support\Facades\Auth;
use BackedEnum;
use UnitEnum;

class TrilhasPage extends Page
{
    protected string $view = 'filament.user.trilhas-page';

    protected static ?string $title = 'Trilhas de Estudo';

    protected static BackedEnum|string|null $navigationIcon = 'heroicon-o-map';

    protected static ?string $navigationLabel = 'Trilhas';

    protected static ?int $navigationSort = 4;

    protected static string|UnitEnum|null $navigationGroup = 'Explorar';

    protected static ?string $slug = 'trilhas';

    public array $trails = [];
    public int $completedTrails = 0;
    public int $inProgressTrails = 0;


    public function mount(): void
    {
        $user = Auth::user();
        if (! $user) {
            return;
        }

        $this->loadTrails($user);
    }

    protected function loadTrails($user): void
    {
        $userTrails = $user->trails()->get()->keyBy('id');

        $this->trails = Trail::active()
            ->withCount([
                'articles as articles_count',
                'articles as required_articles_count' => fn ($q) => $q->where('article_trail.is_required', true),
                'recipes as recipes_count',
                'recipes as required_recipes_count' => fn ($q) => $q->where('trail_recipe.is_required', true),
            ])
            ->get()
            ->map(function ($trail) use ($userTrails) {
                $userTrail = $userTrails->get($trail->id);
                $isRequired = (int) $trail->required_articles_count + (int) $trail->required_recipes_count;

                return [
                    'id' => $trail->id,
                    'title' => $trail->title,
                    'slug' => $trail->slug,
                    'description' => $trail->description,
                    'icon' => $trail->icon ?? '🛤️',
                    'color' => $trail->color ?? '#B27C4E',
                    'difficulty' => $trail->difficulty ?? 'iniciante',
                    'estimated_hours' => $trail->estimated_hours,
                    'grain_reward' => $trail->grain_reward,
                    'articles_count' => (int) $trail->articles_count,
                    'recipes_count' => (int) $trail->recipes_count,
                    'user_progress' => $userTrail ? (int) $userTrail->pivot->progress : 0,
                    'is_started' => $userTrail !== null,
                    'is_completed' => $userTrail ? (bool) $userTrail->pivot->is_completed : false,
                    'required_total' => $isRequired,
                ];
            })
            ->toArray();

        $this->completedTrails = collect($this->trails)->where('is_completed', true)->count();
        $this->inProgressTrails = collect($this->trails)->where('is_started', true)->where('is_completed', false)->count();
    }
}
