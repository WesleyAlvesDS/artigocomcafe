<?php

namespace App\Filament\Widgets\Integrations;

use App\Services\Integrations\GuardianService;
use App\Services\Integrations\HackerNewsService;
use Filament\Widgets\Widget;

class HeadlinesWidget extends Widget
{
    protected static ?int $sort = 42;

    protected string $view = 'filament.widgets.integrations.headlines-widget';

    public static function canView(): bool
    {
        return auth()->user()?->isAdministrator() ?? false;
    }

    protected function getViewData(): array
    {
        $guardian = app(GuardianService::class)->headlines(null, 5);
        $hackerNews = app(HackerNewsService::class)->headlines(5);

        return [
            'guardian' => $guardian['items'] ?? [],
            'hackerNews' => $hackerNews['items'] ?? [],
        ];
    }
}
