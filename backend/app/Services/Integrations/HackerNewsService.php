<?php

namespace App\Services\Integrations;

use Illuminate\Support\Facades\Http;

/**
 * Integração com a API oficial do Hacker News (Firebase).
 *
 * Docs: https://github.com/HackerNews/API
 * Gratuita, sem chave de API.
 */
class HackerNewsService extends ApiClient
{
    protected int $cacheTtl = 900; // 15 min

    /**
     * Retorna os IDs das top stories.
     */
    public function topStoryIds(bool $fresh = false): array
    {
        return $this->cachedGet(
            'hackernews.top_ids',
            fn () => Http::timeout($this->requestTimeout())
                ->get('https://hacker-news.firebaseio.com/v0/topstories.json'),
            fresh: $fresh,
        ) ?? [];
    }

    /**
     * Busca o detalhe de uma história.
     */
    public function story(int $id): ?array
    {
        return $this->cachedGet("hackernews.story.{$id}", function () use ($id) {
            return Http::timeout($this->requestTimeout())
                ->get("https://hacker-news.firebaseio.com/v0/item/{$id}.json");
        });
    }

    /**
     * Retorna as top stories normalizadas para exibição.
     */
    public function headlines(int $limit = 8, bool $fresh = false): array
    {
        $ids = array_slice($this->topStoryIds($fresh), 0, $limit);

        $items = [];

        foreach ($ids as $id) {
            $story = $fresh
                ? $this->fetchStory($id)
                : $this->story($id);

            if (! $story) {
                continue;
            }

            $items[] = [
                'title' => $story['title'] ?? 'Sem título',
                'url' => $story['url'] ?? 'https://news.ycombinator.com/item?id='.$id,
                'section' => 'Hacker News',
                'published_at' => isset($story['time']) ? date('c', $story['time']) : null,
                'thumbnail' => null,
                'excerpt' => 'Pontos: '.($story['score'] ?? 0).' · Comentários: '.($story['descendants'] ?? 0),
                'author' => $story['by'] ?? null,
                'source' => 'Hacker News',
            ];
        }

        return [
            'items' => $items,
            'total' => count($items),
            'source' => 'Hacker News',
            'cached_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Busca o detalhe de uma história sem passar pelo cache
     * (usado apenas no teste de conexão).
     */
    protected function fetchStory(int $id): ?array
    {
        try {
            $response = Http::timeout($this->requestTimeout())
                ->get("https://hacker-news.firebaseio.com/v0/item/{$id}.json");

            return $response->successful() ? $response->json() : null;
        } catch (\Throwable) {
            return null;
        }
    }
}
