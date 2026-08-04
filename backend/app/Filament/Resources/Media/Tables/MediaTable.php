<?php

namespace App\Filament\Resources\Media\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class MediaTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('path')
                    ->label('')
                    ->disk('public')
                    ->height(40)
                    ->square(),
                TextColumn::make('name')
                    ->label('Nome')
                    ->searchable()
                    ->limit(40),
                TextColumn::make('mime_type')
                    ->label('Tipo')
                    ->badge(),
                TextColumn::make('size')
                    ->label('Tamanho')
                    ->formatStateUsing(
                        fn (int $state): string => $state >= 1048576
                            ? round($state / 1048576, 2) . ' MB'
                            : round($state / 1024, 1) . ' KB'
                    ),
                TextColumn::make('uploader.name')
                    ->label('Enviado por'),
                TextColumn::make('created_at')
                    ->label('Enviado em')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([
                //
            ])
            ->defaultSort('created_at', 'desc')
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}