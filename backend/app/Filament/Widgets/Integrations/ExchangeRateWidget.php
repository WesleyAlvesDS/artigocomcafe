<?php

namespace App\Filament\Widgets\Integrations;

use App\Services\Integrations\ExchangeRateService;
use Filament\Widgets\Widget;

class ExchangeRateWidget extends Widget
{
    protected static ?int $sort = 41;

    protected string $view = 'filament.widgets.integrations.exchange-rate-widget';

    public static function canView(): bool
    {
        return auth()->user()?->isAdministrator() ?? false;
    }

    protected function getViewData(): array
    {
        return [
            'rates' => app(ExchangeRateService::class)->latest('BRL'),
        ];
    }
}
