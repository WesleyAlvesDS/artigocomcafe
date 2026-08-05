<?php

namespace App\Filament\Resources\Recipes;

use App\Filament\Resources\Recipes\Pages\CreateRecipe;
use App\Filament\Resources\Recipes\Pages\EditRecipe;
use App\Filament\Resources\Recipes\Pages\ListRecipes;
use App\Filament\Resources\Recipes\Schemas\RecipeForm;
use App\Filament\Resources\Recipes\Tables\RecipesTable;
use App\Models\Recipe;
use App\Services\Integrations\OpenverseService;
use BackedEnum;
use Filament\Actions\Action;
use Filament\Actions\Contracts\HasActions;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;
use UnitEnum;

class RecipeResource extends Resource
{
    protected static ?string $model = Recipe::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedCake;

    protected static ?string $navigationLabel = 'Receitas';

    protected static string|UnitEnum|null $navigationGroup = 'Conteúdo';

    protected static ?string $modelLabel = 'Receita';

    protected static ?string $pluralModelLabel = 'Receitas';

    protected static ?int $navigationSort = 3;

    public static function canViewAny(): bool
    {
        return auth()->user()?->hasDashboardAccess() ?? false;
    }

    public static function form(Schema $schema): Schema
    {
        return RecipeForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return RecipesTable::configure($table);
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
            'index' => ListRecipes::route('/'),
            'create' => CreateRecipe::route('/create'),
            'edit' => EditRecipe::route('/{record}/edit'),
        ];
    }

    public static function getRecordRouteBindingEloquentQuery(): Builder
    {
        return parent::getRecordRouteBindingEloquentQuery()
            ->withoutGlobalScopes([
                SoftDeletingScope::class,
            ]);
    }

    /**
     * Ação "Sugerir capa": busca imagens livres (Creative Commons) no
     * Openverse a partir de um termo (padrão: título da receita) e aplica
     * a primeira como capa no formulário.
     */
    public static function suggestCoverAction(): Action
    {
        return Action::make('suggestCover')
            ->label('Sugerir capa (Openverse)')
            ->icon(Heroicon::OutlinedPhoto)
            ->color('gray')
            ->form([
                TextInput::make('query')
                    ->label('Busca por imagem')
                    ->required()
                    ->maxLength(120)
                    ->helperText('Busca imagens com licença para uso comercial (Creative Commons).'),
            ])
            ->mountUsing(function (HasActions $livewire, Schema $schema): void {
                $query = method_exists($livewire, 'getRecord') && $livewire->getRecord()
                    ? $livewire->getRecord()->title
                    : 'café';

                $schema->fill(['query' => $query]);
            })
            ->action(function (array $data, HasActions $livewire, Action $action): void {
                $url = app(OpenverseService::class)->firstFor($data['query'] ?? 'café');

                if (! $url) {
                    $action->failure('Nenhuma imagem encontrada para a busca. Tente outro termo.');

                    return;
                }

                $livewire->data['cover_image'] = $url;

                Notification::make()
                    ->title('Capa sugerida!')
                    ->body('Confira o preview no formulário e salve a receita.')
                    ->success()
                    ->send();
            });
    }
}
