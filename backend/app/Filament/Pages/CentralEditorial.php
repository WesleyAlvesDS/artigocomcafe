<?php

namespace App\Filament\Pages;

use App\Filament\Resources\Articles\ArticleResource;
use App\Models\Article;
use App\Services\Integrations\CurrentsService;
use App\Services\Integrations\GNewsService;
use App\Services\Integrations\GuardianService;
use App\Services\Integrations\HackerNewsService;
use App\Services\Integrations\OpenverseService;
use BackedEnum;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Support\Icons\Heroicon;
use Illuminate\Support\Str;
use UnitEnum;

/**
 * Central Editorial — busca de notícias em múltiplas fontes e criação
 * de rascunhos de artigo com capa sugerida via Openverse.
 *
 * Fontes: The Guardian, Hacker News, Currents API e GNews.
 * Chaves configuráveis na página "Integrações".
 */
class CentralEditorial extends Page
{
    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedNewspaper;

    protected static ?string $navigationLabel = 'Central Editorial';

    protected static ?string $title = 'Central Editorial';

    protected static string|UnitEnum|null $navigationGroup = 'Conteúdo';

    protected static ?int $navigationSort = 1;

    protected string $view = 'filament.pages.central-editorial';

    /** Termo de busca. */
    public string $query = '';

    /** Fonte selecionada ('all' para todas). */
    public string $source = 'all';

    /** Resultados normalizados da última busca. */
    public array $results = [];

    /** Se uma busca já foi executada. */
    public bool $searched = false;

    /**
     * Executa a busca nas fontes selecionadas.
     */
    public function search(): void
    {
        $q = trim($this->query);

        if ($q === '') {
            Notification::make()
                ->title('Digite um termo para buscar')
                ->warning()
                ->send();

            return;
        }

        $items = [];

        foreach ($this->activeSources() as $key => $service) {
            // Hacker News não tem busca por termo — usa as top stories
            $fetched = $key === 'hackernews'
                ? ($service->headlines(6)['items'] ?? [])
                : ($service->headlines($q, 6)['items'] ?? []);

            foreach ($fetched as $item) {
                $item['source_key'] = $key;
                $items[] = $item;
            }
        }

        // Ordena por data de publicação (mais recentes primeiro)
        usort($items, fn ($a, $b) => strcmp($b['published_at'] ?? '', $a['published_at'] ?? ''));

        $this->results = $items;
        $this->searched = true;

        if (empty($items)) {
            Notification::make()
                ->title('Nenhum resultado encontrado')
                ->body('Tente outro termo ou verifique as chaves de API na página Integrações.')
                ->warning()
                ->send();
        }
    }

    /**
     * Cria um rascunho de artigo a partir de um resultado.
     */
    public function createDraft(int $index): void
    {
        $item = $this->results[$index] ?? null;

        if (! $item) {
            return;
        }

        $title = Str::limit($item['title_pt'] ?? $item['title'] ?? 'Sem título', 200);

        $article = Article::create([
            'title' => $title,
            'slug' => $this->uniqueSlug(Str::slug($title)),
            'excerpt' => Str::limit($item['excerpt_pt'] ?? $item['excerpt'] ?? '', 300),
            'content' => $this->draftContent($item),
            'cover_image' => $this->coverFor($item),
            'featured_image' => $this->coverFor($item),
            'user_id' => auth()->id(),
            'status' => 'draft',
            'reading_time' => $this->readingTime($item),
            'meta' => [
                'source' => $item['source'] ?? null,
                'source_url' => $item['url'] ?? null,
                'created_via' => 'central_editorial',
            ],
        ]);

        Notification::make()
            ->title('Rascunho criado!')
            ->body($article->title)
            ->success()
            ->actions([
                Action::make('open')
                    ->label('Abrir rascunho')
                    ->url(ArticleResource::getUrl('edit', ['record' => $article])),
            ])
            ->send();

        // Remove o item já aproveitado, mantendo o contexto da busca
        unset($this->results[$index]);
        $this->results = array_values($this->results);
    }

    /**
     * Fontes ativas de acordo com o filtro selecionado.
     *
     * @return array<string, object> chave => serviço
     */
    protected function activeSources(): array
    {
        $all = [
            'guardian' => app(GuardianService::class),
            'hackernews' => app(HackerNewsService::class),
            'currents' => app(CurrentsService::class),
            'gnews' => app(GNewsService::class),
        ];

        if ($this->source === 'all') {
            return $all;
        }

        return array_key_exists($this->source, $all)
            ? [$this->source => $all[$this->source]]
            : [];
    }

    /**
     * Gera um slug único (com sufixo numérico quando necessário).
     */
    protected function uniqueSlug(string $slug): string
    {
        $base = $slug !== '' ? $slug : 'artigo';
        $candidate = $base;
        $i = 2;

        while (Article::withTrashed()->where('slug', $candidate)->exists()) {
            $candidate = $base.'-'.$i++;
        }

        return $candidate;
    }

    /**
     * Capa do rascunho: tenta o Openverse com base no título e
     * cai para a thumbnail da própria notícia quando possível.
     */
    protected function coverFor(array $item): ?string
    {
        $cover = app(OpenverseService::class)->firstFor($item['title'] ?? 'coffee');

        return $cover ?? $this->safeUrl($item['thumbnail'] ?? null);
    }

    /**
     * Sanitiza URLs vindas de fontes externas: apenas http/https
     * são aceitas (evita vetores javascript: em atributos href).
     */
    public function safeUrl(mixed $url): ?string
    {
        if (! is_string($url) || $url === '') {
            return null;
        }

        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));

        return in_array($scheme, ['http', 'https'], true) ? $url : null;
    }

    /**
     * Conteúdo inicial do rascunho (HTML para o RichEditor).
     */
    protected function draftContent(array $item): string
    {
        $excerpt = e(Str::limit($item['excerpt_pt'] ?? $item['excerpt'] ?? '', 400));
        $url = e((string) ($this->safeUrl($item['url'] ?? null) ?? '#'));
        $source = e((string) ($item['source'] ?? 'fonte externa'));
        $title = e(Str::limit($item['title_pt'] ?? $item['title'] ?? 'Sem título', 150));

        return "<h2>{$title}</h2>"
            ."<p>{$excerpt}</p>"
            .'<blockquote><p>Fonte: <a href="'.$url.'" rel="nofollow noopener" target="_blank">'.$source.'</a></p></blockquote>';
    }

    /**
     * Estimativa simples de tempo de leitura a partir do resumo
     * (conta palavras com acentuação correta via Unicode).
     */
    protected function readingTime(array $item): string
    {
        $words = count(preg_split('/\s+/u', trim(strip_tags((string) ($item['excerpt'] ?? ''))), -1, PREG_SPLIT_NO_EMPTY) ?: []);

        return max(1, (int) ceil($words / 180)).' min';
    }

    /**
     * Data legível para exibição (protege contra datas malformadas
     * vindas das APIs externas, que quebrariam o Carbon::parse).
     */
    public function humanDate(?string $date): string
    {
        if (! $date) {
            return '';
        }

        try {
            return \Carbon\Carbon::parse($date)->diffForHumans();
        } catch (\Throwable) {
            return '';
        }
    }

    public static function canAccess(): bool
    {
        return auth()->user()?->hasDashboardAccess() ?? false;
    }
}
