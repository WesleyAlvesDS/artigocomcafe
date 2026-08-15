<?php

namespace App\Services\Integrations;

use App\Models\Setting;
use App\Services\TranslationService;
use Illuminate\Support\Facades\Http;

/**
 * Integração com a API Currents (notícias em tempo real).
 *
 * Docs: https://currentsapi.services/en
 * Plano gratuito: ~600-1.000 requisições/dia — cache agressivo aplicado.
 */
class CurrentsService extends ApiClient
{
    protected int $cacheTtl = 1800; // 30 min (notícias envelhecem rápido)

    /**
     * Busca notícias por termo.
     *
     * @param  string|null  $q  termo de busca
     * @param  int  $limit  quantidade de resultados
     * @param  bool  $fresh  ignora o cache (teste de conexão)
     * @return array{status: string, news: array, meta: array}|null
     */
    public function search(?string $q = null, int $limit = 10, bool $fresh = false): ?array
    {
        return $this->cachedGet(
            'currents.search.'.md5($q.'|'.$limit),
            function () use ($q, $limit) {
                return Http::timeout($this->requestTimeout())
                    ->get('https://api.currentsapi.services/v1/search', [
                        'apiKey' => $this->apiKey(),
                        'keywords' => $q,
                        'language' => 'pt',
                        'page_size' => $limit,
                    ]);
            },
            fresh: $fresh,
        );
    }

    /**
     * Retorna as notícias já normalizadas para exibição, com tradução
     * automática pt-BR via TranslationService.
     */
    public function headlines(?string $q = null, int $limit = 8, bool $fresh = false): array
    {
        $data = $this->search($q, $limit, $fresh);

        $news = $data['news'] ?? [];
        $translator = app(TranslationService::class);

        $items = array_map(function (array $item) use ($translator) {
            $title = $item['title'] ?? 'Sem título';
            $excerpt = $item['description'] ?? null;

            return [
                'title' => $title,
                'title_pt' => $translator->toPortuguese($title),
                'url' => $item['url'] ?? null,
                'section' => $item['category'] ?? null,
                'published_at' => $item['published'] ?? null,
                'thumbnail' => $item['image'] ?? null,
                'excerpt' => $excerpt,
                'excerpt_pt' => $translator->toPortuguese($excerpt),
                'author' => $item['author'] ?? null,
                'source' => 'Currents',
            ];
        }, $news);

        return [
            'items' => $items,
            'total' => count($items),
            'source' => 'Currents',
            'cached_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Chave da API: prioriza a configurada na página "Integrações"
     * do Dashboard (tabela settings), com fallback para o .env.
     */
    protected function apiKey(): string
    {
        return (string) (Setting::apiKey('currents_api_key', 'services.currents.key') ?? '');
    }
}
