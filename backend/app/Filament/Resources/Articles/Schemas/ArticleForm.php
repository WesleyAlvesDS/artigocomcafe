<?php

namespace App\Filament\Resources\Articles\Schemas;

use Filament\Forms\Components\Checkbox;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\Str;

class ArticleForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Grid::make(2)->schema([
                    TextInput::make('title')
                        ->label('Título')
                        ->required()
                        ->maxLength(200)
                        ->live(onBlur: true)
                        ->afterStateUpdated(fn ($state, $set) => $set('slug', Str::slug($state))),
                    TextInput::make('slug')
                        ->required()
                        ->maxLength(220)
                        ->unique(ignoreRecord: true),
                ]),
                Textarea::make('excerpt')
                    ->label('Resumo')
                    ->rows(3),
                Section::make('Conteúdo')
                    ->schema([
                        RichEditor::make('content')
                            ->label('Conteúdo')
                            ->required()
                            ->columnSpanFull(),
                    ]),
                Section::make('Publicação')
                    ->columns(2)
                    ->schema([
                        Select::make('category_id')
                            ->label('Categoria')
                            ->relationship('category', 'name')
                            ->preload(),
                        Select::make('user_id')
                            ->label('Autor')
                            ->relationship('author', 'name')
                            ->preload(),
                        Select::make('status')
                            ->options([
                                'draft' => 'Rascunho',
                                'review' => 'Revisão',
                                'scheduled' => 'Agendado',
                                'published' => 'Publicado',
                                'archived' => 'Arquivado',
                            ])
                            ->default('draft')
                            ->required(),
                        Select::make('tags')
                            ->label('Tags')
                            ->multiple()
                            ->relationship('tags', 'name')
                            ->preload(),
                        TextInput::make('reading_time')
                            ->label('Tempo de leitura')
                            ->placeholder('ex: 5 min')
                            ->maxLength(10),
                        DateTimePicker::make('published_at')
                            ->label('Publicado em'),
                        TextInput::make('cover_image')
                            ->label('Imagem de capa (URL)')
                            ->url()
                            ->columnSpanFull(),
                        TextInput::make('featured_image')
                            ->label('Imagem de destaque (URL)')
                            ->url()
                            ->columnSpanFull(),
                    ]),
                Section::make('Destaque')
                    ->columns(3)
                    ->schema([
                        Checkbox::make('is_featured')
                            ->label('Em destaque'),
                        Checkbox::make('is_cafe_do_dia')
                            ->label('Café do dia'),
                        DatePicker::make('cafe_do_dia_date')
                            ->label('Data do café do dia'),
                    ]),
            ]);
    }
}
