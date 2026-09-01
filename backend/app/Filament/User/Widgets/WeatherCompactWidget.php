<?php

namespace App\Filament\User\Widgets;

use App\Services\Integrations\OpenWeatherService;
use Filament\Widgets\Widget;
use Illuminate\Support\Facades\Cache;

class WeatherCompactWidget extends Widget
{
    protected static ?int $sort = 30;
    protected string $view = 'filament.user.widgets.weather-compact-widget';

    /**
     * Cache por 30 minutos (mesmo TTL do serviço).
     * Widgets de clima mudam lentamente.
     */
    protected int $cacheTtl = 1800;

    protected function getViewData(): array
    {
        $cacheKey = 'widget.weather.current';

        $weather = Cache::remember($cacheKey, $this->cacheTtl, function () {
            try {
                return app(OpenWeatherService::class)->current();
            } catch (\Exception $e) {
                return null;
            }
        });

        return [
            'weather' => $weather,
        ];
    }

    /**
     * Limpa o cache do widget.
     */
    public static function clearCache(): void
    {
        Cache::forget('widget.weather.current');
    }
}
