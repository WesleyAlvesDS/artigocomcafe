<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Integrations\ExchangeRateService;
use App\Services\Integrations\GuardianService;
use App\Services\Integrations\HackerNewsService;
use App\Services\Integrations\OpenWeatherService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IntegrationController extends Controller
{
    /**
     * Manchetes externas (Guardian + Hacker News).
     */
    public function headlines(Request $request): JsonResponse
    {
        $guardian = app(GuardianService::class)->headlines(
            $request->query('q'),
            min((int) $request->query('limit', 5), 20),
        );

        $hackerNews = app(HackerNewsService::class)->headlines(
            min((int) $request->query('limit', 5), 20),
        );

        return response()->json([
            'data' => [
                'guardian' => $guardian,
                'hacker_news' => $hackerNews,
            ],
        ]);
    }

    /**
     * Clima atual por cidade.
     */
    public function weather(Request $request): JsonResponse
    {
        $city = $request->query('city', 'Sao Paulo');

        $weather = app(OpenWeatherService::class)->current($city);

        if (! $weather) {
            return response()->json(['error' => 'Clima indisponível'], 503);
        }

        return response()->json(['data' => $weather]);
    }

    /**
     * Câmbio a partir de uma moeda base.
     */
    public function exchange(Request $request): JsonResponse
    {
        $base = strtoupper((string) $request->query('base', 'BRL'));

        $rates = app(ExchangeRateService::class)->latest($base);

        if (! $rates) {
            return response()->json(['error' => 'Câmbio indisponível'], 503);
        }

        return response()->json(['data' => $rates]);
    }
}
