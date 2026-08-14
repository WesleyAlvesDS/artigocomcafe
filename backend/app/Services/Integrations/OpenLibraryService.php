<?php

namespace App\Services\Integrations;

use App\Services\TranslationService;
use Illuminate\Support\Facades\Http;

/**
 * Integração com a OpenLibrary API (livre de chave).
 *
 * Endpoints usados:
 *   - Busca:      https://openlibrary.org/search.json?q=...&page=...&limit=...
 *   - Detalhes:   https://openlibrary.org/works/{key}.json
 *   - Capas:      https://covers.openlibrary.org/b/id/{id}-{S|M|L}.jpg
 *                 https://covers.openlibrary.org/b/isbn/{isbn}-{S|M|L}.jpg
 *
 * Documentação: https://openlibrary.org/developers/api
 */
class OpenLibraryService extends ApiClient
{
    protected int $cacheTtl = 3600; // 1 hora
    protected int $timeout = 20;

    private const BASE_URL = 'https://openlibrary.org';

    /**
     * Busca livros na OpenLibrary.
     *
     * @param  string  $query  termo de busca
     * @param  int  $page  página (1-based)
     * @param  int  $limit  resultados por página (máx. 50)
     * @param  string|null  $subject  filtro opcional por assunto
     */
    public function search(string $query, int $page = 1, int $limit = 20, ?string $subject = null, bool $fresh = false): ?array
    {
        $limit = min(max($limit, 1), 50);
        $page = max($page, 1);

        $cacheKey = 'openlibrary.search.'.md5($query.'|'.$page.'|'.$limit.'|'.$subject ?? '');

        $data = $this->cachedGet($cacheKey, function () use ($query, $page, $limit, $subject) {
            $params = [
                'q' => $query,
                'page' => $page,
                'limit' => $limit,
                'fields' => 'key,title,subtitle,author_name,first_publish_year,cover_i,isbn,subject,ratings_average,ratings_count,edition_count,language',
            ];

            if ($subject) {
                $params['subject'] = $subject;
            }

            return Http::timeout($this->requestTimeout())
                ->get(self::BASE_URL.'/search.json', $params);
        }, fresh: $fresh);

        if (! $data || ! isset($data['docs'])) {
            return null;
        }

        $items = collect($data['docs'] ?? [])
            ->filter(fn (array $doc) => ! empty($doc['key']))
            ->map(fn (array $doc) => $this->normalizeDoc($doc))
            ->values()
            ->all();

        return [
            'query' => $query,
            'page' => $page,
            'limit' => $limit,
            'total' => (int) ($data['numFound'] ?? 0),
            'start' => (int) ($data['start'] ?? 0),
            'books' => $items,
            'cached_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Sugestões para a aba "Explorar" — temas de café e conhecimento.
     */
    public function explore(int $limit = 12, bool $fresh = false): ?array
    {
        $themes = [
            ['q' => 'coffee', 'subject' => 'coffee'],
            ['q' => 'coffee history'],
            ['q' => 'barista'],
            ['q' => 'café', 'language' => 'por'],
            ['q' => 'cooking'],
            ['q' => 'technology'],
            ['q' => 'literature fiction'],
        ];

        $books = [];
        $seen = [];

        foreach ($themes as $theme) {
            if (count($books) >= $limit * 2) {
                break;
            }

            $result = $this->search(
                $theme['q'],
                1,
                8,
                $theme['subject'] ?? null,
                $fresh
            );

            if (! $result) {
                continue;
            }

            foreach ($result['books'] as $book) {
                $key = $book['key'] ?? '';
                if ($key === '' || isset($seen[$key])) {
                    continue;
                }
                $seen[$key] = true;
                $books[] = $book;
            }
        }

        return [
            'books' => array_slice($books, 0, $limit),
            'themes' => array_map(fn ($t) => $t['q'], $themes),
            'cached_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Detalhes completos de uma work (edição representativa).
     *
     * @param  string  $key  ex.: OL1234567W
     */
    public function work(string $key, bool $fresh = false): ?array
    {
        $clean = trim($key, '/');
        $cacheKey = 'openlibrary.work.'.md5($clean);

        $data = $this->cachedGet($cacheKey, function () use ($clean) {
            return Http::timeout($this->requestTimeout())
                ->get(self::BASE_URL.'/works/'.$clean.'.json');
        }, fresh: $fresh);

        if (! $data || empty($data['title'])) {
            return null;
        }

        $description = $data['description'] ?? null;
        if (is_array($description)) {
            $description = $description['value'] ?? null;
        }

        $coverId = $data['covers'][0] ?? null;

        // Tradução automática p/ pt-BR (opcional — nunca quebra se falhar):
        // o site é em português e a OpenLibrary devolve tudo em inglês.
        $translator = app(TranslationService::class);
        $titlePt = $translator->toPortuguese($data['title'] ?? null);
        $subtitlePt = $translator->toPortuguese($data['subtitle'] ?? null);
        $descriptionPt = $translator->toPortuguese($description);

        return [
            'key' => $data['key'] ?? null,
            'title' => $data['title'] ?? null,
            'title_pt' => $titlePt,
            'subtitle' => $data['subtitle'] ?? null,
            'subtitle_pt' => $subtitlePt,
            'description' => $description,
            'description_pt' => $descriptionPt,
            'first_publish_year' => $data['first_publish_date'] ?? null,
            'authors' => $data['authors'] ?? [],
            'subjects' => $data['subjects'] ?? [],
            'subject_places' => $data['subject_places'] ?? [],
            'subject_people' => $data['subject_people'] ?? [],
            'excerpts' => $data['excerpts'] ?? [],
            'links' => $data['links'] ?? [],
            'cover_id' => $coverId,
            'covers' => $coverId ? [
                'S' => "https://covers.openlibrary.org/b/id/{$coverId}-S.jpg",
                'M' => "https://covers.openlibrary.org/b/id/{$coverId}-M.jpg",
                'L' => "https://covers.openlibrary.org/b/id/{$coverId}-L.jpg",
            ] : null,
        ];
    }

    /**
     * Normaliza um documento da busca para o formato do frontend.
     */
    private function normalizeDoc(array $doc): array
    {
        $key = $doc['key'] ?? null;
        $coverId = $doc['cover_i'] ?? null;
        $isbn = $doc['isbn'] ?? [];

        // Tradução automática do título/subtítulo (cards e listagens).
        $translator = app(TranslationService::class);
        $titlePt = $translator->toPortuguese($doc['title'] ?? null);
        $subtitlePt = $translator->toPortuguese($doc['subtitle'] ?? null);

        return [
            'key' => $key,
            'title' => $doc['title'] ?? '',
            'title_pt' => $titlePt,
            'subtitle' => $doc['subtitle'] ?? null,
            'subtitle_pt' => $subtitlePt,
            'authors' => $doc['author_name'] ?? [],
            'first_publish_year' => $doc['first_publish_year'] ?? null,
            'subjects' => array_slice($doc['subject'] ?? [], 0, 8),
            'isbn' => array_slice(is_array($isbn) ? $isbn : [], 0, 4),
            'cover_id' => $coverId,
            'covers' => $coverId ? [
                'S' => "https://covers.openlibrary.org/b/id/{$coverId}-S.jpg",
                'M' => "https://covers.openlibrary.org/b/id/{$coverId}-M.jpg",
                'L' => "https://covers.openlibrary.org/b/id/{$coverId}-L.jpg",
            ] : null,
            'rating_avg' => $doc['ratings_average'] ?? null,
            'rating_count' => $doc['ratings_count'] ?? null,
            'edition_count' => $doc['edition_count'] ?? null,
            'languages' => array_slice($doc['language'] ?? [], 0, 6),
        ];
    }
}
