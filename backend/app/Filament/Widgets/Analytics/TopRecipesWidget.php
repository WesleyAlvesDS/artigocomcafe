<?php

namespace App\Filament\Widgets\Analytics;

use App\Models\Recipe;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget;
use Illuminate\Database\Eloquent\Builder;

class TopRecipesWidget extends TableWidget
{
    protected static ?int $sort = 2;

    protected static string|Heroicon|null $icon = Heroicon::OutlinedCake;

    protected int | string | array $columnSpan = 2;

    public function getTableHeading(): string
    {
        return 'Receitas mais acessadas';
    }

    public function getTableQuery(): Builder
    {
        return Recipe::query()
            ->with(['category'])
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
                    ->label('Receita')
                    ->limit(50),
                TextColumn::make('category.name')
                    ->label('Categoria'),
                TextColumn::make('difficulty')
                    ->label('Dificuldade')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'facil' => 'Fácil',
                        'media' => 'Média',
                        'dificil' => 'Difícil',
                        default => $state,
                    }),
                TextColumn::make('views_count')
                    ->label('Views')
                    ->sortable(),
            ]);
    }
}
