<?php

namespace App\Filament\Resources\Recipes\Schemas;

use Filament\Forms\Components\Checkbox;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Get;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\HtmlString;
use Illuminate\Support\Str;

class RecipeForm
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
                Textarea::make('description')
                    ->label('História / Contexto')
                    ->rows(4),
                Section::make('Ingredientes')
                    ->schema([
                        Repeater::make('ingredients')
                            ->label('Ingredientes')
                            ->schema([
                                Grid::make(12)->schema([
                                    TextInput::make('name')
                                        ->label('Ingrediente')
                                        ->required()
                                        ->maxLength(150)
                                        ->columnSpan(5),
                                    TextInput::make('amount')
                                        ->label('Quantidade')
                                        ->maxLength(30)
                                        ->columnSpan(3),
                                    TextInput::make('unit')
                                        ->label('Unidade')
                                        ->maxLength(30)
                                        ->columnSpan(3),
                                    Checkbox::make('optional')
                                        ->label('Opcional')
                                        ->columnSpan(1),
                                ]),
                            ])
                            ->itemLabel(fn (array $state): ?string => $state['name'] ?? null)
                            ->collapsible()
                            ->default([]),
                    ]),
                Section::make('Modo de Preparo')
                    ->schema([
                        Repeater::make('steps')
                            ->label('Passos')
                            ->schema([
                                Textarea::make('description')
                                    ->label('Passo')
                                    ->required()
                                    ->rows(2),
                            ])
                            ->itemLabel(fn (array $state): ?string => $state['description'] ? mb_substr((string) $state['description'], 0, 50).'…' : null)
                            ->collapsible()
                            ->default([]),
                    ]),
                Section::make('Preparação')
                    ->columns(4)
                    ->schema([
                        TextInput::make('prep_time_minutes')
                            ->label('Preparo (min)')
                            ->numeric()
                            ->minValue(0),
                        TextInput::make('cook_time_minutes')
                            ->label('Cozimento (min)')
                            ->numeric()
                            ->minValue(0),
                        TextInput::make('servings')
                            ->label('Rendimento')
                            ->numeric()
                            ->minValue(1)
                            ->default(1),
                        Select::make('difficulty')
                            ->label('Dificuldade')
                            ->options([
                                'facil' => 'Fácil',
                                'media' => 'Média',
                                'dificil' => 'Difícil',
                            ])
                            ->default('facil')
                            ->required(),
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
                        Select::make('tags')
                            ->label('Tags')
                            ->multiple()
                            ->relationship('tags', 'name')
                            ->preload(),
                        Select::make('status')
                            ->options([
                                'draft' => 'Rascunho',
                                'review' => 'Revisão',
                                'published' => 'Publicado',
                                'archived' => 'Arquivado',
                            ])
                            ->default('draft')
                            ->required(),
                        TextInput::make('cover_image')
                            ->label('Imagem de capa (URL)')
                            ->url()
                            ->columnSpanFull(),
                        Placeholder::make('cover_preview')
                            ->label('Preview da capa')
                            ->content(function (Get $get) {
                                $url = $get('cover_image');

                                if (blank($url)) {
                                    return 'Nenhuma imagem definida ainda.';
                                }

                                return new HtmlString(
                                    '<img src="'.e($url).'" alt="Preview da capa" style="max-width:100%;max-height:320px;border-radius:12px;border:1px solid var(--gray-300);object-fit:cover;">'
                                );
                            })
                            ->columnSpanFull(),
                        DateTimePicker::make('published_at')
                            ->label('Publicado em'),
                    ]),
                Section::make('Destaque')
                    ->columns(3)
                    ->schema([
                        Checkbox::make('is_featured')
                            ->label('Em destaque'),
                        Checkbox::make('is_cafe_do_dia')
                            ->label('Receita do dia'),
                    ]),
                Section::make('SEO')
                    ->description('Metadados para otimização de busca e dados estruturados')
                    ->columns(2)
                    ->collapsible()
                    ->collapsed()
                    ->schema([
                        TextInput::make('meta.title')
                            ->label('Meta title')
                            ->helperText('Recomendado: 50–60 caracteres')
                            ->maxLength(70)
                            ->columnSpanFull()
                            ->live(),
                        Textarea::make('meta.description')
                            ->label('Meta description')
                            ->helperText('Recomendado: 140–160 caracteres')
                            ->rows(2)
                            ->maxLength(320)
                            ->columnSpanFull()
                            ->live(),
                        TextInput::make('meta.canonical')
                            ->label('Canonical URL')
                            ->url()
                            ->columnSpanFull(),
                    ]),
            ]);
    }
}
