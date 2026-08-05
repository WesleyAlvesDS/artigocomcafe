<?php

namespace App\Filament\Resources\Recipes\Pages;

use App\Filament\Resources\Recipes\RecipeResource;
use Filament\Actions\Action;
use Filament\Resources\Pages\CreateRecord;

class CreateRecipe extends CreateRecord
{
    protected static string $resource = RecipeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            RecipeResource::suggestCoverAction(),
            Action::make('create')
                ->label('Criar')
                ->submit('create')
                ->keyBindings(['mod+s']),
        ];
    }
}
