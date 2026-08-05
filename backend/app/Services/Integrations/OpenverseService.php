<?php

namespace App\Services\Integrations;

use Illuminate\Support\Facades\Http;

/**
 * Integração com a API do Openverse (Creative Commons).
 *
 * Docs: https://api.openverse.org/v1/
 * Busca imagens com licença para uso comercial e retorna URLs prontas
 * para usar como capa. Funciona anonimamente (com rate limit); se as
 * credenciais Client ID/Secret forem cadastradas na página de
 * Integrações, elas são usadas para subir o limite.
 */
class OpenverseService extends ApiClient
{
    protected int $cacheTtl = 21600; // 6h

    /**
     * Busca imagens por termo, já normalizadas para exibição.
     *
     * @return array<int, array{id: string|null, title: string, url: string|null, thumbnail: string|null, creator: string|null, license: string|null, license_url: string|null}>
     */
    public function search(string $query, int $limit = 6, bool $fresh = false): array
    {
        $data = $this->cachedGet(
            'openverse.search.'.md5($query.'|'.$limit),
            function () use ($query, $limit) {
                return Http::timeout($this->requestTimeout())
                    ->withHeaders($this->headers())
                    ->get('https://api.openverse.org/v1/images/', [
                        'q' => $query,
                        'license_type' => 'commercial',
                        'page_size' => $limit,
                    ]);
            },
            fresh: $fresh,
        );

        $results = $data['results'] ?? [];

        $items = array_map(function (array $item) {
            return [
                'id' => $item['id'] ?? null,
                'title' => $item['title'] ?? 'Imagem',
                'url' => $item['url'] ?? null,
                'thumbnail' => $item['thumbnail'] ?? null,
                'creator' => $item['creator'] ?? null,
                'license' => $item['license'] ?? null,
                'license_url' => $item['license_url'] ?? null,
                'width' => $item['width'] ?? null,
                'height' => $item['height'] ?? null,
            ];
        }, $results);

        return array_slice($items, 0, $limit);
    }

    /**
     * Retorna a URL da primeira imagem encontrada (ou null).
     */
    public function firstFor(string $query): ?string
    {
        $items = $this->search($query, 1);

        return $items[0]['url'] ?? null;
    }

    /**
     * Cabeçalhos da API. O Openverse aceita chamadas anônimas (com rate
     * limit); um User-Agent descritivo ajuda a manter o acesso estável.
     */
    protected function headers(): array
    {
        return [
            'User-Agent' => 'artigocomcafe/1.0 (admin cover suggestion)',
        ];
    }
}
