<?php

namespace App\Filament\User\Resources\CommentResource\Schemas;

use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class CommentForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('article_id')
                    ->label('Artigo')
                    ->relationship('article', 'title')
                    ->searchable()
                    ->preload()
                    ->required(),
                
                Select::make('parent_id')
                    ->label('Responder a')
                    ->relationship('parent', 'content')
                    ->searchable()
                    ->preload()
                    ->getOptionLabelFromRecordUsing(fn ($record) => mb_strimwidth($record->content, 0, 50, '...'))
                    ->helperText('Deixe em branco para comentário principal'),

                Textarea::make('content')
                    ->label('Comentário')
                    ->required()
                    ->rows(5)
                    ->placeholder('Escreva seu comentário...'),

                \Filament\Forms\Components\Toggle::make('is_approved')
                    ->label('Aprovado')
                    ->default(false)
                    ->inline(false)
                    ->visibleOn('edit'),
            ]);
    }
}