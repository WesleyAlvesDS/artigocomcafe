<?php

namespace App\Filament\Widgets\Analytics;

use App\Models\Article;
use App\Models\Category;
use Filament\Support\Colors\Color;
use Filament\Widgets\DoughnutChartWidget;

class CategoryDistributionWidget extends DoughnutChartWidget
{
    protected static ?int $sort = 3;

    protected function getHeading(): string
    {
        return 'Artigos por categoria';
    }

    protected function getData(): array
    {
        $categories = Category::query()
            ->withCount('articles')
            ->whereHas('articles')
            ->orderByDesc('articles_count')
            ->get();

        $fallback = Color::Amber;

        $backgrounds = $categories->map(function (Category $category) use ($fallback) {
            $hex = $category->color ?? $fallback[500];

            return $hex;
        })->all();

        return [
            'datasets' => [
                [
                    'label' => 'Artigos',
                    'data' => $categories->map(fn (Category $c) => $c->articles_count)->all(),
                    'backgroundColor' => $backgrounds,
                ],
            ],
            'labels' => $categories->map(fn (Category $c) => $c->name)->all(),
        ];
    }
}