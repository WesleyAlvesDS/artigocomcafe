<?php

namespace Database\Seeders;

use App\Models\Reward;
use Illuminate\Database\Seeder;

class RewardSeeder extends Seeder
{
    public function run(): void
    {
        $rewards = [
            // === TEMAS (Themes) ===
            ['name' => 'Café Clássico', 'slug' => 'tema-cafe-classico', 'description' => 'Tema padrão com a essência do café', 'type' => 'theme', 'category' => 'cafe', 'icon' => '☕', 'grain_cost' => 0, 'rarity' => 'common', 'sort_order' => 1, 'content' => ['primary' => '#00d4aa', 'secondary' => '#7c3aed']],
            ['name' => 'Biblioteca', 'slug' => 'tema-biblioteca', 'description' => 'Tema inspirado em livros e conhecimento', 'type' => 'theme', 'category' => 'livros', 'icon' => '📚', 'grain_cost' => 200, 'rarity' => 'common', 'sort_order' => 2, 'content' => ['primary' => '#d97706', 'secondary' => '#92400e']],
            ['name' => 'Tech Neon', 'slug' => 'tema-tech-neon', 'description' => 'Tema tecnológico com cores neon vibrantes', 'type' => 'theme', 'category' => 'tecnologia', 'icon' => '💻', 'grain_cost' => 300, 'rarity' => 'uncommon', 'sort_order' => 3, 'content' => ['primary' => '#06b6d4', 'secondary' => '#3b82f6']],
            ['name' => 'Floresta', 'slug' => 'tema-floresta', 'description' => 'Tema natural com tons verdes e terrosos', 'type' => 'theme', 'category' => 'natureza', 'icon' => '🌿', 'grain_cost' => 200, 'rarity' => 'common', 'sort_order' => 4, 'content' => ['primary' => '#22c55e', 'secondary' => '#15803d']],
            ['name' => 'Galáxia', 'slug' => 'tema-galaxia', 'description' => 'Tema espacial com cores cósmicas', 'type' => 'theme', 'category' => 'espaco', 'icon' => '🌌', 'grain_cost' => 500, 'rarity' => 'rare', 'sort_order' => 5, 'content' => ['primary' => '#a855f7', 'secondary' => '#6b21a8']],
            ['name' => 'Retro Games', 'slug' => 'tema-retro-games', 'description' => 'Tema nostálgico de videogames clássicos', 'type' => 'theme', 'category' => 'games', 'icon' => '🎮', 'grain_cost' => 300, 'rarity' => 'uncommon', 'sort_order' => 6, 'content' => ['primary' => '#ef4444', 'secondary' => '#f97316']],
            ['name' => 'Noturno', 'slug' => 'tema-noturno', 'description' => 'Tema escuro premium com acentos dourados', 'type' => 'theme', 'category' => null, 'icon' => '🌙', 'grain_cost' => 800, 'rarity' => 'epic', 'sort_order' => 7, 'content' => ['primary' => '#fbbf24', 'secondary' => '#1e293b']],
            ['name' => 'Oceano', 'slug' => 'tema-oceano', 'description' => 'Tema azul profundo inspirado no mar', 'type' => 'theme', 'category' => null, 'icon' => '🌊', 'grain_cost' => 400, 'rarity' => 'rare', 'sort_order' => 8, 'content' => ['primary' => '#0ea5e9', 'secondary' => '#1e3a5f']],
            ['name' => 'Aurora', 'slug' => 'tema-aurora', 'description' => 'Tema com gradiente aurora boreal', 'type' => 'theme', 'category' => null, 'icon' => '✨', 'grain_cost' => 1200, 'rarity' => 'legendary', 'sort_order' => 9, 'content' => ['primary' => '#10b981', 'secondary' => '#8b5cf6']],

            // === AVATARES (Avatars) ===
            ['name' => 'Cafeteira', 'slug' => 'avatar-cafeteira', 'description' => 'Avatar de cafeteira italiana', 'type' => 'avatar', 'category' => null, 'icon' => '☕', 'grain_cost' => 50, 'rarity' => 'common', 'sort_order' => 10],
            ['name' => 'Leitor', 'slug' => 'avatar-leitor', 'description' => 'Avatar de leitor com livros', 'type' => 'avatar', 'category' => null, 'icon' => '📖', 'grain_cost' => 100, 'rarity' => 'common', 'sort_order' => 11],
            ['name' => 'Dev', 'slug' => 'avatar-dev', 'description' => 'Avatar de desenvolvedor', 'type' => 'avatar', 'category' => null, 'icon' => '👨‍💻', 'grain_cost' => 150, 'rarity' => 'uncommon', 'sort_order' => 12],
            ['name' => 'Astronauta', 'slug' => 'avatar-astronauta', 'description' => 'Avatar de astronauta explorador', 'type' => 'avatar', 'category' => null, 'icon' => '🧑‍🚀', 'grain_cost' => 300, 'rarity' => 'rare', 'sort_order' => 13],
            ['name' => 'Gamer', 'slug' => 'avatar-gamer', 'description' => 'Avatar gamer com headset', 'type' => 'avatar', 'category' => null, 'icon' => '🎮', 'grain_cost' => 150, 'rarity' => 'uncommon', 'sort_order' => 14],
            ['name' => 'Mestre', 'slug' => 'avatar-mestre', 'description' => 'Avatar de mestre do conhecimento', 'type' => 'avatar', 'category' => null, 'icon' => '🎓', 'grain_cost' => 500, 'rarity' => 'epic', 'sort_order' => 15],

            // === MOLDURAS (Frames) ===
            ['name' => 'Moldura Café', 'slug' => 'frame-cafe', 'description' => 'Moldura temática de café', 'type' => 'frame', 'category' => null, 'icon' => '🟤', 'grain_cost' => 80, 'rarity' => 'common', 'sort_order' => 16],
            ['name' => 'Moldura Tech', 'slug' => 'frame-tech', 'description' => 'Moldura tecnológica com pixels', 'type' => 'frame', 'category' => null, 'icon' => '🔷', 'grain_cost' => 150, 'rarity' => 'uncommon', 'sort_order' => 17],
            ['name' => 'Moldura Dourada', 'slug' => 'frame-dourada', 'description' => 'Moldura premium dourada', 'type' => 'frame', 'category' => null, 'icon' => '✨', 'grain_cost' => 400, 'rarity' => 'rare', 'sort_order' => 18],
            ['name' => 'Moldura Diamante', 'slug' => 'frame-diamante', 'description' => 'Moldura lendária de diamante', 'type' => 'frame', 'category' => null, 'icon' => '💎', 'grain_cost' => 800, 'rarity' => 'legendary', 'sort_order' => 19],

            // === ESPECIAIS (Specials) ===
            ['name' => 'Modo Leitura Premium', 'slug' => 'modo-leitura-premium', 'description' => 'Desbloqueie o modo leitura avançado com fonte personalizada e tema exclusivo', 'type' => 'special', 'category' => null, 'icon' => '📖', 'grain_cost' => 300, 'rarity' => 'rare', 'sort_order' => 20],
            ['name' => 'Certificado Simbólico', 'slug' => 'certificado-simbolico', 'description' => 'Certificado personalizado de conhecimento', 'type' => 'special', 'category' => null, 'icon' => '🎓', 'grain_cost' => 200, 'rarity' => 'uncommon', 'sort_order' => 21],
            ['name' => 'Resumo Premium', 'slug' => 'resumo-premium', 'description' => 'Acesso a resumos exclusivos gerados por IA', 'type' => 'special', 'category' => null, 'icon' => '🤖', 'grain_cost' => 500, 'rarity' => 'epic', 'sort_order' => 22],
            ['name' => 'Wallpaper Exclusivo', 'slug' => 'wallpaper-exclusivo', 'description' => 'Wallpaper 4K do Artigo com Café', 'type' => 'special', 'category' => null, 'icon' => '🖼️', 'grain_cost' => 100, 'rarity' => 'common', 'sort_order' => 23],
        ];

        foreach ($rewards as $reward) {
            Reward::updateOrCreate(
                ['slug' => $reward['slug']],
                $reward
            );
        }

        $this->command->info('✅ ' . count($rewards) . ' recompensas criadas para a Torrefação!');
    }
}
