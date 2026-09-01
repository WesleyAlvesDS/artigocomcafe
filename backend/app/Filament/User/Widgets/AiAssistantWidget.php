<?php

namespace App\Filament\User\Widgets;

use Filament\Widgets\Widget;

class AiAssistantWidget extends Widget
{
    protected static ?int $sort = 20;
    protected string $view = 'filament.user.widgets.ai-assistant-widget';

    public function getViewData(): array
    {
        return [
            'available' => config('services.ai.available', true),
        ];
    }
}
