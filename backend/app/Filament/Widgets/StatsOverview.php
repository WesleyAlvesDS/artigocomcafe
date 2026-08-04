<?php

namespace App\Filament\Widgets;

use App\Models\Article;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\DB;

class StatsOverview extends StatsOverviewWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Artigos', Article::count()),
            Stat::make('Publicados', Article::where('status', 'published')->count()),
            Stat::make('Rascunhos', Article::where('status', 'draft')->count()),
            Stat::make('Agendados', Article::where('status', 'scheduled')->count()),
            Stat::make('Usuários', User::count()),
            Stat::make('Visualizações', (int) DB::table('articles')->sum('views_count')),
        ];
    }
}
