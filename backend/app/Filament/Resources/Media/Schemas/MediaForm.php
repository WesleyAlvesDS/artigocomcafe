<?php

namespace App\Filament\Resources\Media\Schemas;

use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class MediaForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Arquivo')
                    ->schema([
                        FileUpload::make('path')
                            ->label('Arquivo')
                            ->disk('public')
                            ->directory('media')
                            ->image()
                            ->imageEditor()
                            ->openable()
                            ->downloadable()
                            ->previewable()
                            ->visibility('public'),
                    ]),
                Section::make('Metadados')
                    ->columns(2)
                    ->schema([
                        TextInput::make('name')
                            ->label('Nome')
                            ->maxLength(255),
                        TextInput::make('alt_text')
                            ->label('Texto alternativo')
                            ->maxLength(255)
                            ->columnSpanFull(),
                        TextInput::make('caption')
                            ->label('Legenda')
                            ->maxLength(255)
                            ->columnSpanFull(),
                        TextInput::make('author')
                            ->label('Autor da imagem')
                            ->maxLength(120),
                        Grid::make(1)
                            ->schema([
                                TextInput::make('mime_type')
                                    ->label('Tipo')
                                    ->disabled()
                                    ->dehydrated(false),
                            ]),
                    ]),
            ]);
    }
}