<?php

namespace App\Filament\Widgets\Analytics;

use App\Models\DailyVisit;
use App\Models\ReadingProgress;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\DB;

class ReaderEngagementWidget extends StatsOverviewWidget
{
    protected static ?int $sort = 0;

    protected function getStats(): array
    {
        $views = (int) DB::table('articles')->sum('views_count');
        $completions = ReadingProgress::query()->where('is_completed', true)->count();
        $activeReaders = DailyVisit::query()->distinct('user_id')->count('user_id');
        $seconds = (int) DB::table('reading_progress')->avg('time_spent_seconds');

        $avgReadMinutes = round($seconds / 60, 1);

        return [
            Stat::make('Visualizações', number_format($views))
                ->description('Total de views de artigos')
                ->color('primary'),
            Stat::make('Leituras concluídas', number_format($completions))
                ->description('Artigos lidos até o fim')
                ->color('success'),
            Stat::make('Tempo médio de leitura', $avgReadMinutes > 0 ? "{$avgReadMinutes} min" : '—')
                ->description('Por leitor')
                ->color('info'),
            Stat::make('Leitores ativos', $activeReaders)
                ->description('Com pelo menos uma visita')
                ->color('warning'),
        ];
    }
}