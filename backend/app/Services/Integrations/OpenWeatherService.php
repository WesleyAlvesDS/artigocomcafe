<?php

namespace App\Services\Integrations;

use Illuminate\Support\Facades\Http;

/**
 * Integração com dados meteorológicos.
 *
 * Fontes (sem necessidade de chave de API):
 *   1. wttr.in      → https://wttr.in/{cidade}?format=j1  (WorldWeatherOnline)
 *   2. Open-Meteo   → fallback automático se wttr.in falhar
 *
 * Retorna JSON no shape usado pelo frontend (docs/apis/).
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

        $normalized = $this->normalize($data, $city);

        if ($normalized) {
            return $normalized;
        }

        // Fallback: Open-Meteo (geocoding + previsão atual)
        $om = $this->cachedGet(
            'weather.om.city.'.md5($city),
            fn () => $this->openMeteoCity($city),
            fresh: $fresh,
        );

        return $om ? $this->normalizeOpenMeteo($om, $city) : null;
    }

    /**
     * Clima atual por coordenadas (lat/lon) — wttr.in aceita "lat,lon".
     */
    public function currentByCoordinates(float $lat, float $lon, bool $fresh = false): ?array
    {
        $label = sprintf('%.4f,%.4f', $lat, $lon);

        $data = $this->cachedGet(
            'weather.coords.'.md5($lat.','.$lon),
            function () use ($lat, $lon) {
                return Http::timeout($this->requestTimeout())
                    ->get('https://wttr.in/'.$lat.','.$lon, [
                        'format' => 'j1',
                    ]);
            },
            fresh: $fresh,
        );

        $normalized = $this->normalize($data, $label);

        if ($normalized) {
            return $normalized;
        }

        // Fallback: Open-Meteo direto por coordenadas
        $om = $this->cachedGet(
            'weather.om.coords.'.md5($lat.','.$lon),
            fn () => $this->openMeteoCoords($lat, $lon),
            fresh: $fresh,
        );

        return $om ? $this->normalizeOpenMeteo($om, $label) : null;
    }

    /**
     * Normaliza a resposta WorldWeatherOnline (j1) para o shape da API.
     */
    protected function normalize(?array $data, string $fallbackCity): ?array
    {
        if (! $data) {
            return null;
        }

        $current = $data['current_condition'][0] ?? [];
        $area = $data['nearest_area'][0] ?? [];

        $description = $current['weatherDesc'][0]['value'] ?? null;
        $iconUrl = $current['weatherIconUrl'][0]['value'] ?? null;

        return [
            'city' => $area['areaName'][0]['value'] ?? $fallbackCity,
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

    /**
     * Busca clima pela cidade no Open-Meteo (geocoding + previsão atual).
     */
    protected function openMeteoCity(string $city): ?array
    {
        $geo = Http::timeout($this->requestTimeout())
            ->get('https://geocoding-api.open-meteo.com/v1/search', [
                'name' => $city,
                'count' => 1,
                'language' => 'pt',
                'format' => 'json',
            ]);

        if ($geo->failed()) {
            return null;
        }

        $geoJson = $geo->json();
        $result = $geoJson['results'][0] ?? null;

        if (! $result) {
            return null;
        }

        $forecast = $this->openMeteoForecast((float) $result['latitude'], (float) $result['longitude']);

        if (! $forecast) {
            return null;
        }

        return [
            'geo' => $result,
            'forecast' => $forecast,
        ];
    }

    /**
     * Busca clima atual no Open-Meteo por coordenadas.
     */
    protected function openMeteoCoords(float $lat, float $lon): ?array
    {
        $forecast = $this->openMeteoForecast($lat, $lon);

        if (! $forecast) {
            return null;
        }

        return [
            'geo' => null,
            'forecast' => $forecast,
        ];
    }

    /**
     * Previsão atual do Open-Meteo para uma coordenada.
     */
    protected function openMeteoForecast(float $lat, float $lon): ?array
    {
        $forecast = Http::timeout($this->requestTimeout())
            ->get('https://api.open-meteo.com/v1/forecast', [
                'latitude' => $lat,
                'longitude' => $lon,
                'current' => 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m',
                'timezone' => 'auto',
            ]);

        if ($forecast->failed() || empty($forecast->json()['current'])) {
            return null;
        }

        return $forecast->json();
    }

    /**
     * Normaliza a resposta do Open-Meteo para o shape da API.
     */
    protected function normalizeOpenMeteo(?array $data, string $fallbackCity): ?array
    {
        if (! $data || ! isset($data['forecast']['current'])) {
            return null;
        }

        $current = $data['forecast']['current'];
        $geo = $data['geo'] ?? null;

        return [
            'city' => $geo['name'] ?? $fallbackCity,
            'region' => $geo['admin1'] ?? null,
            'country' => $geo['country_code'] ?? null,
            'temperature_c' => $current['temperature_2m'] ?? null,
            'feels_like_c' => $current['apparent_temperature'] ?? null,
            'description' => $this->wmoDescription($current['weather_code'] ?? null),
            'icon_url' => null,
            'humidity' => $current['relative_humidity_2m'] ?? null,
            'wind_speed_kmph' => $current['wind_speed_10m'] ?? null,
            'wind_direction' => null,
            'uv_index' => null,
            'observation_time' => $current['time'] ?? null,
            'source' => 'open-meteo',
            'cached_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Traduz o código WMO para uma descrição curta em pt-BR.
     */
    protected function wmoDescription(?int $code): ?string
    {
        return match ($code) {
            0 => 'Céu limpo',
            1 => 'Predominantemente limpo',
            2 => 'Parcialmente nublado',
            3 => 'Encoberto',
            45, 48 => 'Nevoeiro',
            51, 53, 55, 56, 57 => 'Garoa',
            61, 63, 65, 66, 67 => 'Chuva',
            71, 73, 75, 77 => 'Neve',
            80, 81, 82 => 'Pancadas de chuva',
            85, 86 => 'Pancadas de neve',
            95 => 'Tempestade',
            96, 99 => 'Tempestade com granizo',
            default => null,
        };
    }
}
