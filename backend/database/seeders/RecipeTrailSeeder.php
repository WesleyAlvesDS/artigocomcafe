<?php

namespace Database\Seeders;

use App\Models\Recipe;
use App\Models\Trail;
use Illuminate\Database\Seeder;

class RecipeTrailSeeder extends Seeder
{
    public function run(): void
    {
        $trail = Trail::updateOrCreate(
            ['slug' => 'barista-iniciante'],
            [
                'title' => 'Barista Iniciante',
                'description' => 'Do coado perfeito ao capuccino cremoso: uma jornada prática para dominar as receitas essenciais do café.',
                'icon' => '☕',
                'color' => '#b45309',
                'difficulty' => 'iniciante',
                'estimated_hours' => 2,
                'grain_reward' => 40,
                'is_active' => true,
            ]
        );

        $recipes = [
            'cafe-coado-perfeito-na-garrafa-termica' => ['order' => 1, 'is_required' => true],
            'capuccino-cremoso-caseiro' => ['order' => 2, 'is_required' => true],
            'cafe-gelado-com-leite-de-amendoas' => ['order' => 3, 'is_required' => true],
            'pao-de-queijo-de-liquidificador' => ['order' => 4, 'is_required' => true],
            'brigadeiro-de-cafe' => ['order' => 5, 'is_required' => false],
        ];

        foreach ($recipes as $slug => $pivot) {
            $recipe = Recipe::where('slug', $slug)->first();
            if ($recipe) {
                $trail->recipes()->syncWithoutDetaching([$recipe->id => $pivot]);
            }
        }
    }
}
