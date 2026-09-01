<?php

namespace App\Filament\User\Resources\CommentResource\Tables;

use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class CommentsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('article.title')
                    ->label('Artigo')
                    ->searchable()
                    ->sortable()
                    ->limit(40)
                    ->tooltip(fn ($record) => $record->article->title),
                
                TextColumn::make('user.name')
                    ->label('Autor')
                    ->searchable()
                    ->sortable(),
                
                TextColumn::make('content')
                    ->label('Conteúdo')
                    ->limit(80)
                    ->tooltip(fn ($record) => $record->content),
                
                TextColumn::make('parent.content')
                    ->label('Resposta a')
                    ->limit(50)
                    ->placeholder('—')
                    ->tooltip(fn ($record) => $record->parent?->content),
                
                TextColumn::make('is_approved')
                    ->label('Status')
                    ->badge()
                    ->color(fn (bool $state): string => $state ? 'success' : 'warning')
                    ->formatStateUsing(fn (bool $state): string => $state ? 'Aprovado' : 'Pendente')
                    ->sortable(),
                
                TextColumn::make('likes_count')
                    ->label('Curtidas')
                    ->numeric()
                    ->sortable(),
                
                TextColumn::make('created_at')
                    ->label('Criado em')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('is_approved')
                    ->label('Aprovação')
                    ->options([
                        '1' => 'Aprovados',
                        '0' => 'Pendentes',
                    ]),
            ])
            ->defaultSort('created_at', 'desc')
            ->recordActions([
                ViewAction::make(),
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                // No create action for users (they comment from article page)
            ]);
    }
}