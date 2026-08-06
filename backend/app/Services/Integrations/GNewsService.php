<?php

namespace App\Services\Integrations;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;

/**
 * Integração com a API GNews (notícias em tempo real).
 *
 * Docs: https://gnews.io/
 * Plano gratuito: ~100 requisições/dia — cache agressivo aplicado.
 */
class GNewsService extends ApiClient
{
    protected int $cacheTtl = 1800; // 30 min (notícias envelhecem rápido)

    /**
     * Busca notícias por termo.
     *
     * @param  string|null  $q  termo de busca
     * @param  int  $limit  quantidade de resultados
     * @param  bool  $fresh  ignora o cache (teste de conexão)
     * @return array{totalArticles: int, articles: array}|null
     */
    public function search(?string $q = null, int $limit = 10, bool $fresh = false): ?array
    {
        return $this->cachedGet(
            'gnews.search.'.md5($q.'|'.$limit),
            function () use ($q, $limit) {
                return Http::timeout($this->requestTimeout())
                    ->get('https://gnews.io/api/v4/search', [
                        'token' => $this->apiKey(),
                        'q' => $q,
                        'lang' => 'pt',
                        'max' => $limit,
                    ]);
            },
            fresh: $fresh,
        );
    }

    /**
     * Retorna as notícias já normalizadas para exibição.
     */
    public function headlines(?string $q = null, int $limit = 8, bool $fresh = false): array
    {
        $data = $this->search($q, $limit, $fresh);

        $articles = $data['articles'] ?? [];

        $items = array_map(function (array $item) {
            return [
                'title' => $item['title'] ?? 'Sem título',
                'url' => $item['url'] ?? null,
                'section' => $item['source']['name'] ?? null,
                'published_at' => $item['publishedAt'] ?? null,
                'thumbnail' => $item['image'] ?? null,
                'excerpt' => $item['description'] ?? null,
                'author' => $item['source']['name'] ?? null,
                'source' => 'GNews',
            ];
        }, $articles);

        return [
            'items' => $items,
            'total' => $data['totalArticles'] ?? count($items),
            'source' => 'GNews',
            'cached_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Chave da API: prioriza a configurada na página "Integrações"
     * do Dashboard (tabela settings), com fallback para o .env.
     */
    protected function apiKey(): string
    {
        return (string) (Setting::apiKey('gnews_api_key', 'services.gnews.key') ?? '');
    }
}
