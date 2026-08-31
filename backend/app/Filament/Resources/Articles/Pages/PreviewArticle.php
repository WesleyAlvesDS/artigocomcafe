<?php

namespace App\Filament\Resources\Articles\Pages;

use App\Filament\Resources\Articles\ArticleResource;
use Filament\Resources\Pages\Page;
use App\Models\Article;

class PreviewArticle extends Page
{
    protected static string $resource = ArticleResource::class;
    protected string $view = 'filament.resources.articles.pages.preview-article';

    public Article $record;

    public function mount($record): void
    {
        $this->record = Article::findOrFail($record);
    }
}
