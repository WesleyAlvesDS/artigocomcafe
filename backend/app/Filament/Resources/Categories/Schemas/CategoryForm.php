<?php

namespace App\Filament\Resources\Categories\Schemas;

use Filament\Forms\Components\ColorPicker;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Schema;
use Illuminate\Support\Str;

class CategoryForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Grid::make(2)->schema([
                    TextInput::make('name')
                        ->required()
                        ->maxLength(100)
                        ->live(onBlur: true)
                        ->afterStateUpdated(fn ($state, $set) => $set('slug', Str::slug($state))),
                    TextInput::make('slug')
                        ->required()
                        ->maxLength(120)
                        ->unique(ignoreRecord: true),
                    Textarea::make('description')
                        ->columnSpanFull()
                        ->rows(3),
                    TextInput::make('icon')
                        ->label('Ícone')
                        ->placeholder('ex: coffee')
                        ->maxLength(50),
                    ColorPicker::make('color')
                        ->label('Cor'),
                    TextInput::make('order')
                        ->label('Ordem')
                        ->numeric()
                        ->default(0),
                    Toggle::make('is_active')
                        ->label('Ativa')
                        ->inline()
                        ->default(true),
                ]),
            ]);
    }
}
