<?php

namespace Database\Seeders;

use App\Models\Achievement;
use Illuminate\Database\Seeder;

class AchievementSeeder extends Seeder
{
    public function run(): void
    {
        $achievements = [
            ['name' => 'Primeira Leitura', 'slug' => 'primeira-leitura', 'description' => 'Complete sua primeira leitura', 'icon' => '📖', 'category' => 'reading', 'rarity' => 'common', 'grain_reward' => 10, 'conditions' => ['type' => 'articles_read', 'target' => 1]],
            ['name' => 'Leitor Dedicado', 'slug' => 'leitor-dedicado', 'description' => 'Leia 10 artigos completos', 'icon' => '📚', 'category' => 'reading', 'rarity' => 'common', 'grain_reward' => 25, 'conditions' => ['type' => 'articles_read', 'target' => 10]],
            ['name' => 'Biblioteca Iniciante', 'slug' => 'biblioteca-iniciante', 'description' => 'Salve 5 artigos na biblioteca', 'icon' => '📕', 'category' => 'library', 'rarity' => 'common', 'grain_reward' => 15, 'conditions' => ['type' => 'articles_saved', 'target' => 5]],
            ['name' => 'Colecionador', 'slug' => 'colecionador', 'description' => 'Crie sua primeira coleção', 'icon' => '🗂️', 'category' => 'library', 'rarity' => 'common', 'grain_reward' => 10, 'conditions' => ['type' => 'collections_created', 'target' => 1]],
            ['name' => 'Estreia em Trilhas', 'slug' => 'estreia-em-trilhas', 'description' => 'Complete sua primeira trilha', 'icon' => '🏆', 'category' => 'trail', 'rarity' => 'uncommon', 'grain_reward' => 50, 'conditions' => ['type' => 'trails_completed', 'target' => 1]],
            ['name' => 'Explorador', 'slug' => 'explorador', 'description' => 'Leia artigos de 5 categorias diferentes', 'icon' => '🌍', 'category' => 'reading', 'rarity' => 'uncommon', 'grain_reward' => 30, 'conditions' => ['type' => 'categories_explored', 'target' => 5]],
            ['name' => 'Sequência Inicial', 'slug' => 'sequencia-inicial', 'description' => 'Mantenha 3 dias consecutivos de leitura', 'icon' => '🔥', 'category' => 'streak', 'rarity' => 'common', 'grain_reward' => 20, 'conditions' => ['type' => 'daily_streak', 'target' => 3]],
            ['name' => 'Maratona de Leitura', 'slug' => 'maratona-de-leitura', 'description' => 'Mantenha 7 dias consecutivos', 'icon' => '🔥', 'category' => 'streak', 'rarity' => 'uncommon', 'grain_reward' => 50, 'conditions' => ['type' => 'daily_streak', 'target' => 7]],
            ['name' => 'Mestre das Trilhas', 'slug' => 'mestre-das-trilhas', 'description' => 'Complete 5 trilhas', 'icon' => '🎓', 'category' => 'trail', 'rarity' => 'rare', 'grain_reward' => 100, 'conditions' => ['type' => 'trails_completed', 'target' => 5]],
            ['name' => 'Centenário', 'slug' => 'centenario', 'description' => 'Leia 100 artigos', 'icon' => '💯', 'category' => 'reading', 'rarity' => 'rare', 'grain_reward' => 200, 'conditions' => ['type' => 'articles_read', 'target' => 100]],
            ['name' => 'Biblioteca Completa', 'slug' => 'biblioteca-completa', 'description' => 'Crie 10 coleções', 'icon' => '📚', 'category' => 'library', 'rarity' => 'rare', 'grain_reward' => 100, 'conditions' => ['type' => 'collections_created', 'target' => 10]],
            ['name' => 'Dedicação Total', 'slug' => 'dedicacao-total', 'description' => '30 dias consecutivos de leitura', 'icon' => '💪', 'category' => 'streak', 'rarity' => 'epic', 'grain_reward' => 500, 'conditions' => ['type' => 'daily_streak', 'target' => 30]],
            ['name' => 'Enciclopédia', 'slug' => 'enciclopedia', 'description' => 'Explore todas as categorias', 'icon' => '📖', 'category' => 'reading', 'rarity' => 'epic', 'grain_reward' => 300, 'conditions' => ['type' => 'categories_explored', 'target' => 12]],
            ['name' => '100 Grãos', 'slug' => 'cem-graos', 'description' => 'Acumule 100 grãos', 'icon' => '🫘', 'category' => 'grains', 'rarity' => 'common', 'grain_reward' => 20, 'conditions' => ['type' => 'total_grains', 'target' => 100]],
            ['name' => 'Café Premiuм', 'slug' => 'cafe-premium', 'description' => 'Acumule 1000 grãos', 'icon' => '☕', 'category' => 'grains', 'rarity' => 'rare', 'grain_reward' => 100, 'conditions' => ['type' => 'total_grains', 'target' => 1000]],
        ];

        foreach ($achievements as $ach) {
            Achievement::create($ach);
        }
    }
}
