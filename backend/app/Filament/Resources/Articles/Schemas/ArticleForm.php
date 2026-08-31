<?php

namespace App\Filament\Resources\Articles\Schemas;

use Filament\Forms\Components\Checkbox;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\View;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Forms\Components\Split;
use Illuminate\Support\Str;

class ArticleForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Split::make([
                    Grid::make(1)
                        ->schema([
                            Section::make('Conteúdo Principal')
                                ->description('Edite o artigo ou peça ajuda ao Copilot AI')
                                ->schema([
                                    TextInput::make('title')
                                        ->label('Título')
                                        ->extraInputAttributes(['data-ai-context' => 'title'])
                                        ->required()
                                        ->maxLength(200)
                                        ->live(onBlur: true)
                                        ->afterStateUpdated(fn ($state, $set) => $set('slug', Str::slug($state))),
                                    
                                    TextInput::make('slug')
                                        ->required()
                                        ->maxLength(220)
                                        ->unique(ignoreRecord: true),

                                    Textarea::make('excerpt')
                                        ->label('Resumo')
                                        ->rows(3),

                                    RichEditor::make('content')
                                        ->label('Conteúdo')
                                        ->extraInputAttributes(['data-ai-context' => 'content'])
                                        ->required()
                                        ->placeholder('Comece a escrever seu artigo…')
                                        ->toolbarButtons([
                                            'attachFiles', 'blockquote', 'bold', 'bulletList', 'codeBlock', 'h2', 'h3', 'italic', 'link', 'orderedList', 'redo', 'strike', 'subscript', 'superscript', 'table', 'undo', 'underline',
                                        ]),
                                    
                                    // Chat Inline de Refinamento com a IA
                                    \Filament\Forms\Components\View::make('filament.components.ai-refinement-chat')
                                        ->columnSpanFull(),
                                ]),
                        ])
                        ->columnSpan(['lg' => 2]),

                    Grid::make(1)
                        ->schema([
                            Section::make('Configurações de Publicação')
                                ->collapsible()
                                ->schema([
                                    Select::make('status')
                                        ->options([
                                            'draft' => 'Rascunho',
                                            'review' => 'Revisão',
                                            'scheduled' => 'Agendado',
                                            'published' => 'Publicado',
                                            'archived' => 'Arquivado',
                                        ])
                                        ->default('draft')
                                        ->required()
                                        ->native(false),
                                    
                                    DateTimePicker::make('published_at')
                                        ->label('Data de Publicação'),

                                    Select::make('category_id')
                                        ->label('Categoria')
                                        ->relationship('category', 'name')
                                        ->preload()
                                        ->required()
                                        ->native(false),
                                    
                                    Select::make('user_id')
                                        ->label('Autor')
                                        ->relationship('author', 'name')
                                        ->default(auth()->id())
                                        ->preload()
                                        ->native(false),
                                    
                                    Select::make('tags')
                                        ->multiple()
                                        ->relationship('tags', 'name')
                                        ->preload(),
                                ]),

                            Section::make('Mídia & Destaque')
                                ->collapsible()
                                ->collapsed()
                                ->schema([
                                    TextInput::make('cover_image')
                                        ->label('Capa (URL)')
                                        ->url(),
                                    Checkbox::make('is_featured')
                                        ->label('Destaque na Home'),
                                    Checkbox::make('is_cafe_do_dia')
                                        ->label('Café do Dia'),
                                ]),

                            Section::make('SEO & Compartilhamento')
                                ->description('Metadados para busca e redes sociais')
                                ->collapsible()
                                ->collapsed()
                                ->columns(2)
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
                                        ->default('index, follow')
                                        ->native(false),
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
                                        ->default('Article')
                                        ->native(false),
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
                                        ->label('Score SEO')
                                        ->disabled()
                                        ->dehydrated(false)
                                        ->default(0),
                                ]),

                            Section::make('Configurações Avançadas')
                                ->collapsible()
                                ->collapsed()
                                ->columns(3)
                                ->schema([
                                    TextInput::make('reading_time')
                                        ->label('Tempo de leitura')
                                        ->placeholder('ex: 5 min')
                                        ->maxLength(10),
                                    TextInput::make('featured_image')
                                        ->label('Imagem de destaque (URL)')
                                        ->url()
                                        ->columnSpan(2),
                                    DatePicker::make('cafe_do_dia_date')
                                        ->label('Data do café do dia'),
                                ]),

                            Section::make('☕ Café do Dia')
                                ->collapsible()
                                ->collapsed()
                                ->columns(2)
                                ->schema([
                                    Checkbox::make('is_featured')
                                        ->label('Em destaque'),
                                    Checkbox::make('is_cafe_do_dia')
                                        ->label('Marcar como Café do Dia'),
                                ]),
                        ])
                        ->columnSpan(['lg' => 1]),
                ])
                ->sidebarWidth('420px')
                ->columnSpanFull(),
            ]);
    }
}
