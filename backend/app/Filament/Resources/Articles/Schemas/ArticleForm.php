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
                        ->columnSpanFull()
                        ->placeholder('Comece a escrever seu artigo…')
                        ->toolbarButtons([
                            'attachFiles',
                            'blockquote',
                            'bold',
                            'bulletList',
                            'codeBlock',
                            'h2',
                            'h3',
                            'italic',
                            'link',
                            'orderedList',
                            'redo',
                            'strike',
                            'subscript',
                            'superscript',
                            'table',
                            'undo',
                            'underline',
                        ]),
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
                Section::make('SEO')
                    ->description('Metadados para otimização de busca e compartilhamento')
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
                        TextInput::make('meta.og_title')
                            ->label('OG título'),
                        TextInput::make('meta.og_image')
                            ->label('OG imagem (URL)')
                            ->url(),
                        Textarea::make('meta.og_description')
                            ->label('OG descrição')
                            ->rows(2),
                        Select::make('meta.robots')
                            ->label('Robots')
                            ->options([
                                'index, follow' => 'Indexar e seguir',
                                'index, nofollow' => 'Indexar sem seguir',
                                'noindex, follow' => 'Não indexar, seguir',
                                'noindex, nofollow' => 'Não indexar nem seguir',
                            ])
                            ->default('index, follow'),
                        Select::make('meta.schema_type')
                            ->label('Schema.org')
                            ->options([
                                'Article' => 'Article',
                                'BlogPosting' => 'BlogPosting',
                                'NewsArticle' => 'NewsArticle',
                                'TechArticle' => 'TechArticle',
                                'HowTo' => 'HowTo',
                                'Recipe' => 'Recipe',
                            ])
                            ->default('Article'),
                        TextInput::make('meta.slug_source')
                            ->label('Palavra-chave principal')
                            ->helperText('Usada para score SEO')
                            ->live()
                            ->afterStateUpdated(function ($state, $set, $get) {
                                $title = $get('meta.title') ?: $get('title');
                                $has = Str::contains(mb_strtolower($title), mb_strtolower((string) $state));

                                $set('meta.seo_score', $has ? (
                                    mb_strlen((string) $get('meta.description')) >= 140 ? 90 : 65
                                ) : 40);
                            }),
                        TextInput::make('meta.seo_score')
                            ->label('SEO score (auto)')
                            ->disabled()
                            ->dehydrated(false)
                            ->default(0),
                    ]),
            ]);
    }
}
