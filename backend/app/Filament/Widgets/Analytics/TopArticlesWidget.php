<?php

namespace App\Filament\Widgets\Analytics;

use App\Models\Article;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget;
use Illuminate\Database\Eloquent\Builder;

class TopArticlesWidget extends TableWidget
{
    protected static ?int $sort = 1;

    protected static string|Heroicon|null $icon = Heroicon::OutlinedFire;

    protected int | string | array $columnSpan = 2;

    public function getTableHeading(): string
    {
        return 'Artigos mais acessados';
    }

    public function getTableQuery(): Builder
    {
        return Article::query()
            ->with(['category', 'author'])
            ->where('status', 'published')
            ->orderByDesc('views_count')
            ->limit(10);
    }

    public function table(Table $table): Table
    {
        return $table
            ->defaultPaginationPageOption(10)
            ->columns([
                TextColumn::make('title')
                    ->label('Artigo')
                    ->limit(50),
                TextColumn::make('category.name')
                    ->label('Categoria'),
                TextColumn::make('author.name')
                    ->label('Autor'),
                TextColumn::make('views_count')
                    ->label('Views')
                    ->sortable(),
                TextColumn::make('reading_count')
                    ->label('Leituras')
                    ->sortable(),
            ]);
    }
}