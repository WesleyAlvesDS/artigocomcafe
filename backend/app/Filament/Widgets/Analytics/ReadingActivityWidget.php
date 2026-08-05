<?php

namespace App\Filament\Widgets\Analytics;

use App\Models\ReadingProgress;
use Filament\Support\Colors\Color;
use Filament\Widgets\BarChartWidget;
use Illuminate\Support\Carbon;

class ReadingActivityWidget extends BarChartWidget
{
    protected static ?int $sort = 2;

    public function getHeading(): string
    {
        return 'Leituras concluídas (14 dias)';
    }

    protected function getData(): array
    {
        $days = collect(range(13, 0))->map(fn (int $i) => now()->subDays($i)->toDateString());
        $labels = $days->map(fn (string $d) => Carbon::parse($d)->format('d/m'))->all();

        $counts = ReadingProgress::query()
            ->where('is_completed', true)
            ->where('completed_at', '>=', now()->subDays(14)->startOfDay())
            ->selectRaw('DATE(completed_at) as day, COUNT(*) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        return [
            'labels' => $labels,
            'datasets' => [
                [
                    'label' => 'Leituras',
                    'data' => $days->map(fn (string $d) => (int) $counts[$d] ?? 0)->all(),
                    'backgroundColor' => array_fill(0, count($labels), Color::Amber[500]),
                    'borderColor' => array_fill(0, count($labels), Color::Amber[600]),
                ],
            ],
        ];
    }
}