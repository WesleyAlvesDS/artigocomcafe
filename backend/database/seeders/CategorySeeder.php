<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Tecnologia', 'slug' => 'tecnologia', 'icon' => '💻', 'color' => '#3B82F6', 'description' => 'Novidades e análises do mundo tech', 'order' => 1],
            ['name' => 'Inteligência Artificial', 'slug' => 'inteligencia-artificial', 'icon' => '🤖', 'color' => '#8B5CF6', 'description' => 'IA, machine learning e o futuro', 'order' => 2],
            ['name' => 'Programação', 'slug' => 'programacao', 'icon' => '👨‍💻', 'color' => '#10B981', 'description' => 'Código, frameworks e boas práticas', 'order' => 3],
            ['name' => 'Negócios', 'slug' => 'negocios', 'icon' => '💼', 'color' => '#F59E0B', 'description' => 'Empreendedorismo e gestão', 'order' => 4],
            ['name' => 'Produtividade', 'slug' => 'produtividade', 'icon' => '⚡', 'color' => '#EF4444', 'description' => 'Faça mais em menos tempo', 'order' => 5],
            ['name' => 'Carreira', 'slug' => 'carreira', 'icon' => '📈', 'color' => '#06B6D4', 'description' => 'Crescimento profissional', 'order' => 6],
            ['name' => 'Finanças', 'slug' => 'financas', 'icon' => '💰', 'color' => '#84CC16', 'description' => 'Educação financeira e investimentos', 'order' => 7],
            ['name' => 'Educação', 'slug' => 'educacao', 'icon' => '📚', 'color' => '#EC4899', 'description' => 'Aprendizado contínuo e métodos de estudo', 'order' => 8],
            ['name' => 'Saúde e Bem-estar', 'slug' => 'saude-e-bem-estar', 'icon' => '🧠', 'color' => '#22C55E', 'description' => 'Saúde física, mental e qualidade de vida', 'order' => 9],
            ['name' => 'Ciência', 'slug' => 'ciencia', 'icon' => '🔬', 'color' => '#6366F1', 'description' => 'Descobertas científicas e curiosidades', 'order' => 10],
            ['name' => 'Curiosidades', 'slug' => 'curiosidades', 'icon' => '🌟', 'color' => '#F97316', 'description' => 'Fatos interessantes do dia a dia', 'order' => 11],
            ['name' => 'Guias e Tutoriais', 'slug' => 'guias-e-tutoriais', 'icon' => '📖', 'color' => '#A855F7', 'description' => 'Passo a passo para aprender algo novo', 'order' => 12],
        ];

        foreach ($categories as $cat) {
            Category::create($cat);
        }
    }
}
