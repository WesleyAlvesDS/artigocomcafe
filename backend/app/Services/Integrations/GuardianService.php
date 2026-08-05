<?php

namespace App\Services\Integrations;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;

/**
 * Integração com a API do The Guardian Open Platform.
 *
 * Docs: https://open-platform.theguardian.com/
 * Uso gratuito: chave "test" permite acesso de demonstração limitado.
 */
class GuardianService extends ApiClient
{
    /**
     * Busca notícias por termo.
     *
     * @param  string|null  $q  termo de busca
     * @param  int  $limit  quantidade de resultados
     * @param  bool  $fresh  ignora o cache (teste de conexão)
     * @return array{response: array}|null
     */
    public function search(?string $q = null, int $limit = 10, bool $fresh = false): ?array
    {
        return $this->cachedGet(
            'guardian.search.'.md5($q.'|'.$limit),
            function () use ($q, $limit) {
                return Http::timeout($this->requestTimeout())
                    ->get('https://content.guardianapis.com/search', [
                        'api-key' => $this->apiKey(),
                        'q' => $q,
                        'page-size' => $limit,
                        'show-fields' => 'trailText,thumbnail,byline',
                        'show-tags' => 'contributor',
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

        $results = $data['response']['results'] ?? [];

        $items = array_map(function (array $item) {
            $fields = $item['fields'] ?? [];

            return [
                'title' => $item['webTitle'] ?? 'Sem título',
                'url' => $item['webUrl'] ?? null,
                'section' => $item['sectionName'] ?? null,
                'published_at' => $item['webPublicationDate'] ?? null,
                'thumbnail' => $fields['thumbnail'] ?? null,
                'excerpt' => $fields['trailText'] ?? null,
                'author' => $fields['byline'] ?? null,
                'source' => 'Guardian',
            ];
        }, $results);

        return [
            'items' => $items,
            'total' => $data['response']['total'] ?? 0,
            'source' => 'Guardian',
            'cached_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Chave da API: prioriza a configurada na página "Integrações"
     * do Dashboard (tabela settings), com fallback para o .env.
     */
    protected function apiKey(): string
    {
        return (string) (Setting::apiKey('guardian_api_key', 'services.guardian.key') ?? 'test');
    }
}
