<?php

namespace Database\Seeders;

use App\Models\RecipeCategory;
use Illuminate\Database\Seeder;

class RecipeCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Café', 'slug' => 'cafe', 'icon' => '☕', 'color' => '#8B5A2B', 'order' => 1],
            ['name' => 'Bebidas', 'slug' => 'bebidas', 'icon' => '🥤', 'color' => '#F59E0B', 'order' => 2],
            ['name' => 'Acompanhamentos', 'slug' => 'acompanhamentos', 'icon' => '🍞', 'color' => '#F97316', 'order' => 3],
            ['name' => 'Sobremesas', 'slug' => 'sobremesas', 'icon' => '🍰', 'color' => '#EC4899', 'order' => 4],
            ['name' => 'Café Gelado', 'slug' => 'cafe-gelado', 'icon' => '🧊', 'color' => '#06B6D4', 'order' => 5],
            ['name' => 'Doces', 'slug' => 'doces', 'icon' => '🍬', 'color' => '#A855F7', 'order' => 6],
        ];

        foreach ($categories as $cat) {
            RecipeCategory::updateOrCreate(['slug' => $cat['slug']], $cat);
        }
    }
}
