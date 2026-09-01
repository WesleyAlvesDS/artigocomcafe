<?php

namespace App\Providers\Filament;

use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Pages\Dashboard;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class UserPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->id('app')
            ->path('app')
            // ->domain('app.artigocomcafe.com')  // Descomentar em produção
            // ── Login / Registro customizados (Super App) ──────
            ->login(\App\Filament\User\Pages\SuperAppLogin::class)
            ->registration()
            ->profile(\App\Filament\User\Pages\EditProfile::class)
            ->spa()
            // ── Tema Artigo com Café ──────────────────────────────
            ->colors([
                'primary' => Color::hex('#B27C4E'),        // Café principal
                'gray' => Color::hex('#6B5B4E'),           // Marrom suave
                'success' => Color::hex('#4CAF50'),
                'warning' => Color::hex('#D9A05B'),        // Dourado café
                'danger' => Color::hex('#C0392B'),
                'info' => Color::hex('#5DADE2'),
            ])
            // Fontes do design system
            ->font('Inter')
            ->favicon(fn () => asset('favicon.svg'))
            // ── CSS do Tema via Render Hook ──────────────────────
            ->renderHook(
                'panels::head.end',
                fn () => view('filament.components.cafe-theme')->render()
            )
            ->renderHook(
                'panels::body.end',
                fn () => auth()->check() ? view('filament.components.push-notification-manager') : ''
            )
            // Navigation
            ->discoverResources(in: app_path('Filament/User/Resources'), for: 'App\\Filament\\User\\Resources')
            ->discoverPages(in: app_path('Filament/User/Pages'), for: 'App\\Filament\\User\\Pages')
            ->pages([
                \App\Filament\User\Pages\HomeFeed::class,
            ])
            // Widgets
            ->discoverWidgets(in: app_path('Filament/User/Widgets'), for: 'App\\Filament\\User\\Widgets')
            ->widgets([
                \App\Filament\User\Widgets\GamificationWidget::class,
                \App\Filament\User\Widgets\AiAssistantWidget::class,
                \App\Filament\User\Widgets\WeatherCompactWidget::class,
                \App\Filament\User\Widgets\ExchangeCompactWidget::class,
                \App\Filament\User\Widgets\NewsletterWidget::class,
            ])
            // ── Layout ────────────────────────────────────────────
            ->sidebarCollapsibleOnDesktop()
            ->maxContentWidth('7xl')
            // ── Middleware ─────────────────────────────────────────
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
            ]);
    }
}
