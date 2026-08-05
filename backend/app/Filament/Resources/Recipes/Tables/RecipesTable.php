<?php

namespace App\Filament\Resources\Recipes\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ForceDeleteBulkAction;
use Filament\Actions\RestoreBulkAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TrashedFilter;
use Filament\Tables\Table;

class RecipesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('title')
                    ->label('Título')
                    ->searchable()
                    ->sortable()
                    ->limit(50),
                TextColumn::make('category.name')
                    ->label('Categoria')
                    ->sortable(),
                TextColumn::make('difficulty')
                    ->label('Dificuldade')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'facil' => 'Fácil',
                        'media' => 'Média',
                        'dificil' => 'Difícil',
                        default => $state,
                    })
                    ->color(fn (string $state): string => match ($state) {
                        'facil' => 'success',
                        'media' => 'warning',
                        'dificil' => 'danger',
                        default => 'gray',
                    }),
                TextColumn::make('prep_time_minutes')
                    ->label('Preparo')
                    ->formatStateUsing(fn ($state) => $state ? "{$state} min" : '—'),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'published' => 'success',
                        'review' => 'warning',
                        'draft' => 'gray',
                        'archived' => 'danger',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'published' => 'Publicado',
                        'review' => 'Revisão',
                        'draft' => 'Rascunho',
                        'archived' => 'Arquivado',
                        default => $state,
                    })
                    ->sortable(),
                TextColumn::make('author.name')
                    ->label('Autor')
                    ->sortable(),
                TextColumn::make('views_count')
                    ->label('Visualizações')
                    ->sortable(),
                IconColumn::make('is_featured')
                    ->label('Destaque')
                    ->boolean()
                    ->sortable(),
                TextColumn::make('published_at')
                    ->label('Publicado em')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->options([
                        'draft' => 'Rascunho',
                        'review' => 'Revisão',
                        'published' => 'Publicado',
                        'archived' => 'Arquivado',
                    ]),
                SelectFilter::make('category_id')
                    ->label('Categoria')
                    ->relationship('category', 'name'),
                SelectFilter::make('difficulty')
                    ->options([
                        'facil' => 'Fácil',
                        'media' => 'Média',
                        'dificil' => 'Difícil',
                    ]),
                TrashedFilter::make(),
            ])
            ->defaultSort('created_at', 'desc')
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                    ForceDeleteBulkAction::make(),
                    RestoreBulkAction::make(),
                ]),
            ]);
    }
}
