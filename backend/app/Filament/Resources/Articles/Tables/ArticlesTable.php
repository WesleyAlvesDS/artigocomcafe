<?php

namespace App\Filament\Resources\Articles\Tables;

use Filament\Actions\CreateAction;
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
use App\Models\Article;

class ArticlesTable
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
                TextColumn::make('seo_score')
                    ->label('SEO')
                    ->badge()
                    ->sortable(query: fn ($query, $direction) => $query->orderByRaw(
                        "JSON_LENGTH(meta) {$direction}"
                    ))
                    ->getStateUsing(fn (Article $record): int => self::seoScore($record->meta))
                    ->formatStateUsing(fn (int $state): string => "SEO {$state}%")
                    ->color(fn (int $state): string => $state >= 80 ? 'success' : ($state >= 50 ? 'warning' : 'danger')),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'published' => 'success',
                        'scheduled' => 'info',
                        'review' => 'warning',
                        'draft' => 'gray',
                        'archived' => 'danger',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'published' => 'Publicado',
                        'scheduled' => 'Agendado',
                        'review' => 'Revisão',
                        'draft' => 'Rascunho',
                        'archived' => 'Arquivado',
                        default => $state,
                    })
                    ->sortable(),
                TextColumn::make('category.name')
                    ->label('Categoria')
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
                        'scheduled' => 'Agendado',
                        'published' => 'Publicado',
                        'archived' => 'Arquivado',
                    ]),
                SelectFilter::make('category_id')
                    ->label('Categoria')
                    ->relationship('category', 'name'),
                TrashedFilter::make(),
            ])
            ->defaultSort('created_at', 'desc')
            ->recordActions([
                EditAction::make()
                    ->slideOver()
                    ->modalWidth('5xl')
                    ->after(fn () => $this->emit('refreshArticles')),
                \Filament\Actions\Action::make('preview')
                    ->label('Preview')
                    ->icon('heroicon-o-eye')
                    ->color('gray')
                    ->url(fn (Article $record): string => ArticleResource::getUrl('preview', ['record' => $record])),
            ])
->headerActions([
                CreateAction::make()
                    ->label('Criar Artigo')
                    ->modalHeading('Novo Artigo')
                    ->slideOver()
                    ->modalWidth('5xl')
                    ->createAnother(false)
                    ->after(fn () => $this->emit('refreshArticles'))
                    ->successNotificationTitle('Artigo criado com sucesso!'),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                    ForceDeleteBulkAction::make(),
                    RestoreBulkAction::make(),
                ]),
            ]);
    }

    protected static function seoScore(?array $meta): int
    {
        if (empty($meta)) {
            return 0;
        }

        $required = [
            'title' => 25,
            'description' => 25,
            'canonical' => 15,
            'og_title' => 10,
            'og_image' => 10,
            'robots' => 5,
            'schema_type' => 5,
            'slug_source' => 5,
        ];

        $score = 0;

        foreach ($required as $key => $weight) {
            $value = $meta[$key] ?? null;

            if (is_string($value) && trim($value) !== '') {
                $score += $weight;
            } elseif ($value !== null && $value !== '') {
                $score += $weight;
            }
        }

        return $score;
    }
}
