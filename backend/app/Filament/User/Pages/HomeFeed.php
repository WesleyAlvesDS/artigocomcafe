<?php

namespace App\Filament\User\Pages;

use App\Models\Article;
use App\Models\Category;
use App\Models\Recipe;
use BackedEnum;
use Filament\Pages\Page;
use Livewire\Attributes\Computed;
use Livewire\Attributes\On;
use Livewire\Attributes\Url;

class HomeFeed extends Page
{
    protected string $view = 'filament.user.home-feed';

    protected static ?string $title = 'Artigo com Café';

    protected static BackedEnum|string|null $navigationIcon = 'heroicon-o-home';

    protected static ?string $navigationLabel = 'Início';

    protected static ?int $navigationSort = 0;

    // ── State ─────────────────────────────────────────────
    #[Url(as: 'filter')]
    public string $activeFilter = 'all';

    public int $feedPage = 1;
    public int $perPage = 8;
    public bool $isLoadingMore = false;

    // ── Computed Data ─────────────────────────────────────

    #[Computed]
    #[On('filterChanged')]
    public function categories(): array
    {
        return Category::where('is_active', true)
            ->orderBy('order')
            ->get(['id', 'name', 'slug', 'icon', 'color'])
            ->toArray();
    }

    #[Computed]
    public function featuredArticles(): array
    {
        return Article::published()
            ->featured()
            ->with(['category:id,name,slug,color'])
            ->orderByDesc('published_at')
            ->limit(3)
            ->get()
            ->map(fn ($article) => [
                'id' => $article->id,
                'title' => $article->title,
                'excerpt' => $article->excerpt,
                'cover_image' => $article->cover_image ?? $article->featured_image,
                'category' => $article->category?->name ?? 'Geral',
                'category_color' => $article->category?->color ?? '#B27C4E',
                'slug' => $article->slug,
                'reading_time' => $article->reading_time ?? max(1, (int) ceil(str_word_count(strip_tags($article->content ?? '')) / 180)),
                'author' => $article->author?->name ?? 'Artigo com Café',
                'published_at_raw' => $article->published_at?->timestamp ?? 0,
            ])
            ->toArray();
    }

    #[Computed]
    public function feedItems(): array
    {
        $offset = ($this->feedPage - 1) * $this->perPage;
        $items = [];

        // ── Artigos ──
        if ($this->activeFilter === 'all' || $this->activeFilter !== 'recipes') {
            $query = Article::published()
                ->with(['category:id,name,slug,color', 'author:id,name']);

            if ($this->activeFilter !== 'all') {
                $query->whereHas('category', fn ($q) => $q->where('slug', $this->activeFilter));
            }

            $articles = $query
                ->orderByDesc('published_at')
                ->skip($offset)
                ->limit($this->perPage)
                ->get();

            foreach ($articles as $article) {
                $items[] = [
                    'type' => 'article',
                    'id' => $article->id,
                    'title' => $article->title,
                    'excerpt' => $article->excerpt,
                    'cover_image' => $article->cover_image ?? $article->featured_image,
                    'category' => $article->category?->name ?? 'Geral',
                    'category_color' => $article->category?->color ?? '#B27C4E',
                    'category_icon' => $article->category?->icon ?? '📄',
                    'slug' => $article->slug,
                    'reading_time' => $article->reading_time ?? max(1, (int) ceil(str_word_count(strip_tags($article->content ?? '')) / 180)),
                    'author' => $article->author?->name ?? 'Artigo com Café',
                    'author_avatar' => $article->author?->avatar ?? null,
                    'published_at' => $article->published_at?->diffForHumans(),
                    'published_at_raw' => $article->published_at?->timestamp ?? 0,
                ];
            }
        }

        // ── Receitas ──
        if ($this->activeFilter === 'all' || $this->activeFilter === 'recipes') {
            $recipeLimit = $this->activeFilter === 'recipes' ? $this->perPage : 3;

            $recipes = Recipe::published()
                ->with(['category:id,name,slug,icon,color'])
                ->orderByDesc('published_at')
                ->skip($offset)
                ->limit($recipeLimit)
                ->get();

            foreach ($recipes as $recipe) {
                $items[] = [
                    'type' => 'recipe',
                    'id' => $recipe->id,
                    'title' => $recipe->title,
                    'excerpt' => $recipe->excerpt ?? $recipe->description,
                    'cover_image' => $recipe->cover_image,
                    'category' => $recipe->category?->name ?? 'Receita',
                    'category_color' => $recipe->category?->color ?? '#059669',
                    'category_icon' => $recipe->category?->icon ?? '☕',
                    'slug' => $recipe->slug,
                    'difficulty' => $recipe->difficulty_label,
                    'prep_time' => $recipe->prep_time_minutes ? $recipe->prep_time_minutes . ' min' : null,
                    'published_at' => $recipe->published_at?->diffForHumans(),
                    'published_at_raw' => $recipe->published_at?->timestamp ?? 0,
                ];
            }
        }

        // Ordena por timestamp (mais recentes primeiro)
        usort($items, fn ($a, $b) => ($b['published_at_raw'] ?? 0) - ($a['published_at_raw'] ?? 0));

        // Remove campo auxiliar
        foreach ($items as &$item) {
            unset($item['published_at_raw']);
        }
        unset($item);

        return $items;
    }

    #[Computed]
    public function hasMore(): bool
    {
        $count = count($this->feedItems);
        return $count >= $this->perPage;
    }

    // ── Actions ───────────────────────────────────────────

    public function setFilter(string $filter): void
    {
        $this->activeFilter = $filter;
        $this->feedPage = 1;
        $this->dispatch('filterChanged');
    }

    public function loadMore(): void
    {
        if ($this->isLoadingMore || ! $this->hasMore) {
            return;
        }

        $this->isLoadingMore = true;
        $this->feedPage++;

        // Livewire v3 auto-re-renders after public method call
        // Computed properties will be recalculated with new feedPage

        $this->isLoadingMore = false;
    }

    public function bookmarkArticle(int $articleId): void
    {
        $user = auth()->user();
        if (! $user) {
            return;
        }

        $collection = $user->collections()->firstOrCreate(
            ['name' => 'Salvos'],
            ['description' => 'Artigos salvos pelo usuário', 'icon' => '🔖', 'color' => '#B27C4E']
        );

        if (! $collection->articles()->where('article_id', $articleId)->exists()) {
            $collection->articles()->attach($articleId);
        }

        $this->dispatch('showToast', icon: '🔖', title: 'Artigo salvo!', message: 'Adicionado à sua biblioteca');
    }
}
