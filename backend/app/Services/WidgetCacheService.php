<?php

namespace App\Services;

use App\Filament\User\Widgets\ExchangeCompactWidget;
use App\Filament\User\Widgets\GamificationWidget;
use App\Filament\User\Widgets\WeatherCompactWidget;
use Illuminate\Support\Facades\Cache;

class WidgetCacheService
{
    /**
     * Prefixo do cache para todos os widgets.
     */
    protected string $prefix = 'widget.';

    /**
     * Limpa o cache de gamificação de um usuário específico.
     * Chamado quando o usuário completa ações que afetam seus stats.
     */
    public function clearUserGamification(int $userId): void
    {
        GamificationWidget::clearCache($userId);
    }

    /**
     * Limpa o cache de clima.
     * Chamado quando o serviço de clima é atualizado ou para forçar refresh.
     */
    public function clearWeather(): void
    {
        WeatherCompactWidget::clearCache();
    }

    /**
     * Limpa o cache de câmbio.
     * Chamado quando o serviço de câmbio é atualizado ou para forçar refresh.
     */
    public function clearExchange(): void
    {
        ExchangeCompactWidget::clearCache();
    }

    /**
     * Limpa todos os caches de widgets de um usuário.
     */
    public function clearAllForUser(int $userId): void
    {
        $this->clearUserGamification($userId);
        // Weather e Exchange são globais, não por usuário
    }

    /**
     * Limpa todos os caches de widgets (admin only).
     */
    public function clearAll(): void
    {
        // Limpa todos os caches com o prefixo widget.
        $keys = Cache::get('widget_cache_keys', []);

        foreach ($keys as $key) {
            Cache::forget($key);
        }

        // Limpa a lista de chaves
        Cache::forget('widget_cache_keys');

        // Limpa diretamente os known keys
        Cache::forget('widget.weather.current');
        Cache::forget('widget.exchange.rates');
    }

    /**
     * Retorna estatísticas de cache para debug.
     */
    public function getStats(): array
    {
        return [
            'weather_cached' => Cache::has('widget.weather.current'),
            'exchange_cached' => Cache::has('widget.exchange.rates'),
            'weather_ttl' => Cache::has('widget.weather.current') ? '30 min' : 'N/A',
            'exchange_ttl' => Cache::has('widget.exchange.rates') ? '1 hour' : 'N/A',
        ];
    }
}
