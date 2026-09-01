<?php

namespace App\Filament\User\Pages;

use App\Models\Article;
use App\Models\Collection;
use Filament\Pages\Page;
use Illuminate\Support\Facades\Auth;
use BackedEnum;
use UnitEnum;

class BibliotecaPage extends Page
{
    protected string $view = 'filament.user.biblioteca-page';

    protected static ?string $title = 'Minha Biblioteca';

    protected static BackedEnum|string|null $navigationIcon = 'heroicon-o-bookmark';

    protected static ?string $navigationLabel = 'Biblioteca';

    protected static ?int $navigationSort = 3;

    protected static string|UnitEnum|null $navigationGroup = 'Explorar';

    protected static ?string $slug = 'biblioteca';

    public array $collections = [];
    public array $savedArticles = [];
    public int $totalSaved = 0;


    public function mount(): void
    {
        $user = Auth::user();
        if (! $user) {
            return;
        }

        $this->loadCollections($user);
        $this->loadSavedArticles($user);
    }

    protected function loadCollections($user): void
    {
        $this->collections = $user->collections()
            ->withCount('articles')
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn ($collection) => [
                'id' => $collection->id,
                'name' => $collection->name,
                'description' => $collection->description,
                'icon' => $collection->icon ?? '📚',
                'color' => $collection->color ?? '#8b5a2b',
                'articles_count' => $collection->articles_count,
                'is_public' => $collection->is_public,
                'updated_at' => $collection->updated_at->diffForHumans(),
            ])
            ->toArray();
    }

    protected function loadSavedArticles($user): void
    {
        $articleIds = $user->collections()
            ->with('articles')
            ->get()
            ->pluck('articles')
            ->flatten()
            ->pluck('id')
            ->unique();

        $this->totalSaved = $articleIds->count();

        $this->savedArticles = $articleIds->isEmpty()
            ? []
            : Article::published()
                ->with(['category:id,name,slug,color', 'author:id,name'])
                ->whereIn('id', $articleIds)
                ->orderByDesc('published_at')
                ->limit(20)
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
                    'published_at' => $article->published_at?->diffForHumans(),
                ])
                ->toArray();
    }
}
