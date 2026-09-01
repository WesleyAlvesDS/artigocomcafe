<?php

namespace App\Filament\User\Pages;

use Filament\Pages\Dashboard as BaseDashboard;
use Illuminate\Support\Facades\Auth;

class Dashboard extends BaseDashboard
{
    protected string $view = 'filament.user.dashboard';

    public function mount(): void
    {
        parent::mount();
    }

    public function getTitle(): string
    {
        return 'Início';
    }

    public function getHeading(): string
    {
        return 'Bem-vindo de volta, ' . (Auth::user()->name ?? 'Leitor') . '!';
    }

    public function getWidgets(): array
    {
        return [
            \App\Filament\User\Widgets\GamificationWidget::class,
            \App\Filament\User\Widgets\AiAssistantWidget::class,
            \App\Filament\User\Widgets\WeatherCompactWidget::class,
            \App\Filament\User\Widgets\ExchangeCompactWidget::class,
            \App\Filament\User\Widgets\NewsletterWidget::class,
        ];
    }
}
