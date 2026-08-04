<?php

namespace App\Filament\Resources\Users\Schemas;

use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Schema;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Grid::make(2)->schema([
                    TextInput::make('name')
                        ->required()
                        ->maxLength(255),
                    TextInput::make('username')
                        ->required()
                        ->maxLength(50)
                        ->unique(ignoreRecord: true),
                    TextInput::make('email')
                        ->email()
                        ->required()
                        ->unique(ignoreRecord: true),
                    TextInput::make('password')
                        ->password()
                        ->revealable()
                        ->dehydrated(fn ($state): bool => filled($state))
                        ->required(fn (string $operation): bool => $operation === 'create'),
                    Textarea::make('bio')
                        ->columnSpanFull()
                        ->rows(3),
                    TextInput::make('avatar')
                        ->columnSpanFull()
                        ->url(),
                    TextInput::make('theme')
                        ->label('Tema')
                        ->default('cafe')
                        ->maxLength(20),
                    Select::make('role')
                        ->label('Papel')
                        ->options([
                            'admin' => 'Administrador',
                            'editor' => 'Editor',
                            'reader' => 'Leitor',
                        ])
                        ->default('reader')
                        ->required(),
                ]),
            ]);
    }
}
