<?php

namespace App\Services\Integrations;

use Illuminate\Support\Facades\Http;

/**
 * Integração com dados meteorológicos via wttr.in.
 *
 * Endpoint livre de chave: https://wttr.in/{cidade}?format=j1
 * Retorna JSON no formato WorldWeatherOnline (mesmo usado nos specs de api_u/).
 */
class OpenWeatherService extends ApiClient
{
    protected int $cacheTtl = 1800; // 30 min

    /**
     * Clima atual para uma cidade (padrão: São Paulo).
     */
    public function current(string $city = 'Sao Paulo', bool $fresh = false): ?array
    {
        $data = $this->cachedGet(
            'weather.current.'.md5($city),
            function () use ($city) {
                return Http::timeout($this->requestTimeout())
                    ->get('https://wttr.in/'.urlencode($city), [
                        'format' => 'j1',
                    ]);
            },
            fresh: $fresh,
        );

        if (! $data) {
            return null;
        }

        $current = $data['current_condition'][0] ?? [];
        $area = $data['nearest_area'][0] ?? [];

        $description = $current['weatherDesc'][0]['value'] ?? null;
        $iconUrl = $current['weatherIconUrl'][0]['value'] ?? null;

        return [
            'city' => $area['areaName'][0]['value'] ?? $city,
            'region' => $area['region'][0]['value'] ?? null,
            'country' => $area['country'][0]['value'] ?? null,
            'temperature_c' => $current['temp_C'] ?? null,
            'feels_like_c' => $current['FeelsLikeC'] ?? null,
            'description' => $description,
            'icon_url' => $iconUrl,
            'humidity' => $current['humidity'] ?? null,
            'wind_speed_kmph' => $current['windspeedKmph'] ?? null,
            'wind_direction' => $current['winddir16Point'] ?? null,
            'uv_index' => $current['uvIndex'] ?? null,
            'observation_time' => $current['observation_time'] ?? null,
            'source' => 'wttr.in',
            'cached_at' => now()->toIso8601String(),
        ];
    }
}
