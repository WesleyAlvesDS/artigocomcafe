<?php

namespace App\Filament\Resources\ActivityLogs;

use App\Filament\Resources\ActivityLogs\Pages\ListActivityLogs;
use App\Filament\Resources\ActivityLogs\Pages\ViewActivityLog;
use App\Filament\Resources\ActivityLogs\Tables\ActivityLogsTable;
use App\Models\ActivityLog;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class ActivityLogResource extends Resource
{
    protected static ?string $model = ActivityLog::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedClipboardDocumentList;

    protected static ?string $navigationLabel = 'Logs / Auditoria';

    protected static string|UnitEnum|null $navigationGroup = 'Sistema';

    protected static ?string $modelLabel = 'Log';

    protected static ?string $pluralModelLabel = 'Logs';

    protected static ?int $navigationSort = 1;

    public static function canViewAny(): bool
    {
        return auth()->user()?->isAdministrator() ?? false;
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Grid::make(2)->schema([
                    TextInput::make('action')
                        ->label('Ação')
                        ->disabled(),
                    TextInput::make('user.name')
                        ->label('Usuário')
                        ->disabled(),
                    TextInput::make('model_label')
                        ->label('Recurso')
                        ->disabled(),
                    TextInput::make('model_id')
                        ->label('ID')
                        ->disabled(),
                    TextInput::make('ip')
                        ->label('IP')
                        ->disabled(),
                    TextInput::make('created_at')
                        ->label('Data')
                        ->disabled(),
                ]),
                Section::make('Dados da solicitação')
                    ->schema([
                        Textarea::make('payload_json')
                            ->label('Alterações')
                            ->rows(8)
                            ->disabled()
                            ->afterStateHydrated(
                                function (Textarea $component): void {
                                    $record = $component->getRecord();
                                    $component->state(
                                        $record?->payload ? json_encode($record->payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) : null
                                    );
                                }
                            ),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return ActivityLogsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListActivityLogs::route('/'),
            'view' => ViewActivityLog::route('/{record}'),
        ];
    }
}