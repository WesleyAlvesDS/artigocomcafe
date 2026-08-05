<?php

namespace App\Services\Integrations;

use Illuminate\Support\Facades\Http;

/**
 * Integração com dados de câmbio via open.er-api.com.
 *
 * Endpoint livre de chave: https://open.er-api.com/v6/latest/{base}
 * (O antigo api.exchangerate.host passou a exigir access_key.)
 */
class ExchangeRateService extends ApiClient
{
    protected int $cacheTtl = 3600; // 1 hora

    /**
     * Cotações a partir de uma moeda base (padrão: BRL).
     */
    public function latest(string $base = 'BRL', bool $fresh = false): ?array
    {
        $data = $this->cachedGet(
            'exchange.rates.'.strtoupper($base),
            function () use ($base) {
                return Http::timeout($this->requestTimeout())
                    ->get('https://open.er-api.com/v6/latest/'.strtoupper($base));
            },
            fresh: $fresh,
        );

        if (! $data || ($data['result'] ?? null) !== 'success') {
            return null;
        }

        $rates = $data['rates'] ?? [];

        // Moedas de maior interesse para o público brasileiro
        $interesting = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'ARS', 'CAD', 'AUD', 'CHF'];

        $items = collect($interesting)
            ->filter(fn (string $code) => isset($rates[$code]))
            ->map(function (string $code) use ($rates, $base) {
                $rate = (float) $rates[$code];

                return [
                    'base' => $base,
                    'code' => $code,
                    'rate' => $rate,
                    // Quanto custa 1 unidade da moeda estrangeira em BRL (ou na base)
                    'inverse' => $rate > 0 ? round(1 / $rate, 4) : null,
                ];
            })
            ->values()
            ->all();

        return [
            'base' => $base,
            'updated_at' => $data['time_last_update_utc'] ?? null,
            'rates' => $items,
            'source' => 'open.er-api.com',
            'cached_at' => now()->toIso8601String(),
        ];
    }
}
