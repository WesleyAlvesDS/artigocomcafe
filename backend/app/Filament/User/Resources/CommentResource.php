<?php

namespace App\Filament\User\Resources\CommentResource;

use App\Filament\User\Resources\CommentResource\Pages\CreateComment;
use App\Filament\User\Resources\CommentResource\Pages\EditComment;
use App\Filament\User\Resources\CommentResource\Pages\ListComments;
use App\Filament\User\Resources\CommentResource\Schemas\CommentForm;
use App\Filament\User\Resources\CommentResource\Tables\CommentsTable;
use App\Models\Comment;
use BackedEnum;
use UnitEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class CommentResource extends Resource
{
    protected static ?string $model = Comment::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedChatBubbleLeft;

    protected static ?string $navigationLabel = 'Comentários';

    protected static string|UnitEnum|null $navigationGroup = 'Comunidade';

    protected static ?int $navigationSort = 1;

    public static function form(Schema $schema): Schema
    {
        return CommentForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return CommentsTable::configure($table);
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
            'index' => ListComments::route('/'),
            'create' => CreateComment::route('/create'),
            'edit' => EditComment::route('/{record}/edit'),
        ];
    }

    public static function canViewAny(): bool
    {
        return auth()->user()?->hasDashboardAccess() ?? false;
    }
}