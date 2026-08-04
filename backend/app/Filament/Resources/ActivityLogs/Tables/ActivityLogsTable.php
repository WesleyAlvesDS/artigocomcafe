<?php

namespace App\Filament\Resources\ActivityLogs\Tables;

use Filament\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class ActivityLogsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('created_at')
                    ->label('Data')
                    ->dateTime('d/m/Y H:i:s')
                    ->sortable(),
                TextColumn::make('action')
                    ->label('Ação')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'deleted' => 'danger',
                        'created' => 'success',
                        'updated' => 'info',
                        'login' => 'primary',
                        'logout' => 'gray',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn ($record): string => $record->action_label),
                TextColumn::make('user.name')
                    ->label('Usuário')
                    ->searchable(),
                TextColumn::make('model_label')
                    ->label('Recurso')
                    ->searchable(),
                TextColumn::make('model_id')
                    ->label('ID'),
                TextColumn::make('ip')
                    ->label('IP')
                    ->searchable(),
            ])
            ->filters([
                SelectFilter::make('action')
                    ->label('Ação')
                    ->options([
                        'created' => 'Criado',
                        'updated' => 'Atualizado',
                        'deleted' => 'Excluído',
                        'login' => 'Login',
                        'logout' => 'Logout',
                    ]),
                SelectFilter::make('user_id')
                    ->label('Usuário')
                    ->relationship('user', 'name'),
            ])
            ->defaultSort('created_at', 'desc')
            ->recordActions([
                ViewAction::make(),
            ])
            ->poll('15s');
    }
}