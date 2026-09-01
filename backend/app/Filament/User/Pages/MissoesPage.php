<?php

namespace App\Filament\User\Pages;

use App\Models\Mission;
use Filament\Pages\Page;
use Illuminate\Support\Facades\Auth;
use BackedEnum;
use UnitEnum;

class MissoesPage extends Page
{
    protected string $view = 'filament.user.missoes-page';

    protected static ?string $title = 'Missões';

    protected static BackedEnum|string|null $navigationIcon = 'heroicon-o-target';

    protected static ?string $navigationLabel = 'Missões';

    protected static ?int $navigationSort = 2;

    protected static string|UnitEnum|null $navigationGroup = 'Explorar';

    protected static ?string $slug = 'missoes';

    public array $dailyMissions = [];
    public array $weeklyMissions = [];
    public int $dailyCompleted = 0;
    public int $dailyTotal = 0;
    public int $weeklyCompleted = 0;
    public int $weeklyTotal = 0;


    public function mount(): void
    {
        $user = Auth::user();
        if (! $user) {
            return;
        }

        $this->loadDailyMissions($user);
        $this->loadWeeklyMissions($user);
    }

    protected function loadDailyMissions($user): void
    {
        $today = now()->toDateString();

        $this->dailyMissions = Mission::daily()->get()->map(function ($mission) use ($user, $today) {
            $userMission = $user->missions()
                ->where('mission_id', $mission->id)
                ->where('assigned_date', $today)
                ->first();

            return [
                'id' => $mission->id,
                'title' => $mission->title,
                'description' => $mission->description,
                'icon' => $mission->icon ?? '🎯',
                'reward' => $mission->grain_reward,
                'progress' => $userMission ? $userMission->pivot->progress : 0,
                'target' => $mission->conditions['target'] ?? 1,
                'is_completed' => $userMission ? (bool) $userMission->pivot->is_completed : false,
            ];
        })->toArray();

        $this->dailyTotal = count($this->dailyMissions);
        $this->dailyCompleted = collect($this->dailyMissions)->where('is_completed', true)->count();
    }

    protected function loadWeeklyMissions($user): void
    {
        $startOfWeek = now()->startOfWeek()->toDateString();
        $endOfWeek = now()->endOfWeek()->toDateString();

        $this->weeklyMissions = Mission::weekly()->get()->map(function ($mission) use ($user, $startOfWeek, $endOfWeek) {
            $userMission = $user->missions()
                ->where('mission_id', $mission->id)
                ->whereBetween('assigned_date', [$startOfWeek, $endOfWeek])
                ->first();

            return [
                'id' => $mission->id,
                'title' => $mission->title,
                'description' => $mission->description,
                'icon' => $mission->icon ?? '🏆',
                'reward' => $mission->grain_reward,
                'progress' => $userMission ? $userMission->pivot->progress : 0,
                'target' => $mission->conditions['target'] ?? 1,
                'is_completed' => $userMission ? (bool) $userMission->pivot->is_completed : false,
            ];
        })->toArray();

        $this->weeklyTotal = count($this->weeklyMissions);
        $this->weeklyCompleted = collect($this->weeklyMissions)->where('is_completed', true)->count();
    }
}
