<?php

namespace App\Filament\Widgets\Integrations;

use App\Services\Integrations\OpenWeatherService;
use Filament\Widgets\Widget;

class WeatherWidget extends Widget
{
    protected static ?int $sort = 40;

    protected string $view = 'filament.widgets.integrations.weather-widget';

    public static function canView(): bool
    {
        return auth()->user()?->isAdministrator() ?? false;
    }

    protected function getViewData(): array
    {
        return [
            'weather' => app(OpenWeatherService::class)->current(),
        ];
    }
}
