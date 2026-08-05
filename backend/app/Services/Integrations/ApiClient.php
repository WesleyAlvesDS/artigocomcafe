<?php

namespace App\Services\Integrations;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Cliente HTTP base para as integrações de API externas.
 *
 * Aplica cache agressivo nas respostas (TTL padrão de 1 hora),
 * conforme recomendação do docs/planoapi.md, para não estourar
 * os limites gratuitos das APIs.
 *
 * Importante: apenas resultados bem-sucedidos (não-nulos) são
 * cacheados — falhas transitórias não ficam presas no cache.
 */
abstract class ApiClient
{
    /**
     * TTL padrão do cache em segundos (1 hora).
     */
    protected int $cacheTtl = 3600;

    /**
     * Timeout da requisição HTTP em segundos.
     */
    protected int $timeout = 15;

    /**
     * Executa um GET com cache: busca no cache, e em caso de miss
     * consulta a API externa. Resultados null (falha) NÃO são cacheados.
     *
     * @param  bool  $fresh  ignora o cache (usado no "testar conexão")
     */
    protected function cachedGet(string $cacheKey, callable $request, ?int $ttl = null, bool $fresh = false): ?array
    {
        $key = "integrations.{$cacheKey}";

        if (! $fresh && ($cached = Cache::get($key)) !== null) {
            return is_array($cached) ? $cached : null;
        }

        $result = $this->safeRequest($request);

        if ($result !== null) {
            Cache::put($key, $result, $ttl ?? $this->cacheTtl);
        }

        return $result;
    }

    /**
     * Executa a requisição capturando falhas de rede/HTTP para não
     * quebrar o dashboard (retorna null em caso de erro).
     */
    protected function safeRequest(callable $request): ?array
    {
        try {
            $response = $request();

            if ($response->failed()) {
                Log::warning('Integração externa respondeu com erro', [
                    'status' => $response->status(),
                    'body' => substr((string) $response->body(), 0, 500),
                ]);

                return null;
            }

            return $response->json();
        } catch (Throwable $e) {
            Log::warning('Falha na integração externa', [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Timeout configurado para as requisições.
     */
    protected function requestTimeout(): int
    {
        return $this->timeout;
    }
}
