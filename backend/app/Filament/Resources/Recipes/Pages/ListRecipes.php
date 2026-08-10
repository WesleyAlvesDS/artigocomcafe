<?php

namespace App\Filament\Resources\Recipes\Pages;

use App\Filament\Resources\Recipes\RecipeResource;
use App\Services\RecipeImportService;
use Filament\Actions\Action;
use Filament\Actions\CreateAction;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ListRecords;
use Filament\Support\Icons\Heroicon;

class ListRecipes extends ListRecords
{
    protected static string $resource = RecipeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
            Action::make('importMealDb')
                ->label('Importar do TheMealDB')
                ->icon(Heroicon::OutlinedArrowDownTray)
                ->color('gray')
                ->requiresConfirmation()
                ->modalHeading('Importar receitas do acervo aberto')
                ->modalDescription('Importa as receitas em pt-BR do arquivo TheMealDB/TheCocktailDB (CC-BY-NC) já carregado no servidor. Receitas com mesmo slug são atualizadas; novas são criadas.')
                ->modalSubmitActionLabel('Importar agora')
                ->action(function (): void {
                    $service = app(RecipeImportService::class);
                    try {
                        $result = $service->import(database_path('data/mealdb-recipes.json'));
                        Notification::make()
                            ->title('Importação concluída!')
                            ->body(sprintf(
                                '%d criadas, %d atualizadas, %d ignoradas e %d categorias.',
                                $result['created'],
                                $result['updated'],
                                $result['skipped'],
                                $result['categories']
                            ))
                            ->success()
                            ->send();
                        $this->redirect(request()->fullUrl());
                    } catch (\Throwable $e) {
                        Notification::make()
                            ->title('Falha na importação')
                            ->body($e->getMessage())
                            ->danger()
                            ->send();
                    }
                }),
        ];
    }
}
