<?php

namespace App\Console\Commands;

use App\Services\RecipeImportService;
use Illuminate\Console\Command;

class ImportRecipes extends Command
{
    protected $signature = 'recipes:import {--file= : Caminho do JSON de receitas (padrão: database/data/mealdb-recipes.json)}';

    protected $description = 'Importa receitas do arquivo gerado pelo TheMealDB/TheCocktailDB (pt-BR)';

    public function handle(RecipeImportService $service): int
    {
        $file = $this->option('file')
            ?: database_path('data/mealdb-recipes.json');

        try {
            $result = $service->import($file);
        } catch (\Throwable $e) {
            $this->error('Falha na importação: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->info(
            sprintf(
                'Importação concluída: %d criadas, %d atualizadas, %d ignoradas, %d categorias.',
                $result['created'],
                $result['updated'],
                $result['skipped'],
                $result['categories']
            )
        );

        return self::SUCCESS;
    }
}
