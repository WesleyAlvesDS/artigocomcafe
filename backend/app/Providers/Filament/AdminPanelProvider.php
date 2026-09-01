<?php

namespace App\Providers\Filament;

use App\Filament\Widgets\StatsOverview;
use App\Filament\Widgets\Analytics\CategoryDistributionWidget;
use App\Filament\Widgets\Analytics\ReaderEngagementWidget;
use App\Filament\Widgets\Analytics\ReadingActivityWidget;
use App\Filament\Widgets\Analytics\TopArticlesWidget;
use App\Filament\Widgets\Analytics\TopRecipesWidget;
use App\Filament\Widgets\Integrations\ExchangeRateWidget;
use App\Filament\Widgets\Integrations\HeadlinesWidget;
use App\Filament\Widgets\Integrations\WeatherWidget;
use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Pages\Dashboard;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\Widgets\AccountWidget;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('dash')
            ->domain('dash.artigocomcafe.com')
            ->path('')
            ->login()
            ->spa()
            ->colors([
                'primary' => [
                    50 => '#fdf8f3',
                    100 => '#f7eadd',
                    200 => '#edd1bb',
                    300 => '#ddae8e',
                    400 => '#c98662',
                    500 => '#bc6a44',
                    600 => '#ae5739',
                    700 => '#914532',
                    800 => '#75392d',
                    900 => '#603128',
                    950 => '#341814',
                ],
                'gray' => Color::Slate,
            ])
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\Filament\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\Filament\Pages')
            ->pages([
                Dashboard::class,
            ])
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\Filament\Widgets')
            ->widgets([
                AccountWidget::class,
                StatsOverview::class,
                ReaderEngagementWidget::class,
                TopArticlesWidget::class,
                TopRecipesWidget::class,
                ReadingActivityWidget::class,
                CategoryDistributionWidget::class,
                WeatherWidget::class,
                ExchangeRateWidget::class,
                HeadlinesWidget::class,
            ])
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                PreventRequestForgery::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ])
            ->renderHook('panels::head.end', fn () => view('filament.components.pwa-head'))
            ->renderHook('panels::body.end', fn () => auth()->check() ? view('filament.components.ai-assistant-balloon') : '')
            ->renderHook('panels::body.start', fn () => auth()->check() ? view('filament.components.mobile-bottom-bar') : '');
    }
}
