<?php

namespace App\Filament\User\Widgets;

use App\Services\Integrations\ExchangeRateService;
use Filament\Widgets\Widget;
use Illuminate\Support\Facades\Cache;

class ExchangeCompactWidget extends Widget
{
    protected static ?int $sort = 31;
    protected string $view = 'filament.user.widgets.exchange-compact-widget';

    /**
     * Cache por 1 hora (mesmo TTL do serviço).
     * Câmbio não muda frequentemente.
     */
    protected int $cacheTtl = 3600;

    protected function getViewData(): array
    {
        $cacheKey = 'widget.exchange.rates';

        $rates = Cache::remember($cacheKey, $this->cacheTtl, function () {
            try {
                return app(ExchangeRateService::class)->latest('BRL');
            } catch (\Exception $e) {
                return null;
            }
        });

        return [
            'rates' => $rates,
        ];
    }

    /**
     * Limpa o cache do widget.
     */
    public static function clearCache(): void
    {
        Cache::forget('widget.exchange.rates');
    }
}
