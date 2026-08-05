<?php

namespace Database\Seeders;

use App\Models\Mission;
use Illuminate\Database\Seeder;

class MissionSeeder extends Seeder
{
    public function run(): void
    {
        $missions = [
            [
                'title' => 'Leitura do Dia',
                'description' => 'Leia um artigo completo hoje',
                'icon' => '📖',
                'type' => 'daily',
                'conditions' => ['action' => 'read_article', 'target' => 1],
                'grain_reward' => 5,
                'expires_in_hours' => 24,
            ],
            [
                'title' => 'Pausa do Café',
                'description' => 'Conclua a leitura de uma receita hoje',
                'icon' => '☕',
                'type' => 'daily',
                'conditions' => ['action' => 'read_recipe', 'target' => 1],
                'grain_reward' => 5,
                'expires_in_hours' => 24,
            ],
            [
                'title' => 'Explorador Diário',
                'description' => 'Leia artigos de 2 categorias diferentes',
                'icon' => '🌍',
                'type' => 'daily',
                'conditions' => ['action' => 'read_categories', 'target' => 2],
                'grain_reward' => 10,
                'expires_in_hours' => 24,
            ],
            [
                'title' => 'Salvador de Ideias',
                'description' => 'Salve 2 artigos na sua biblioteca',
                'icon' => '💡',
                'type' => 'daily',
                'conditions' => ['action' => 'save_article', 'target' => 2],
                'grain_reward' => 8,
                'expires_in_hours' => 24,
            ],
            [
                'title' => 'Maratona Semanal',
                'description' => 'Leia 7 artigos nesta semana',
                'icon' => '📚',
                'type' => 'weekly',
                'conditions' => ['action' => 'read_article', 'target' => 7],
                'grain_reward' => 50,
                'expires_in_hours' => 168,
            ],
            [
                'title' => 'Colecionador Semanal',
                'description' => 'Crie 3 coleções novas',
                'icon' => '🗂️',
                'type' => 'weekly',
                'conditions' => ['action' => 'create_collection', 'target' => 3],
                'grain_reward' => 30,
                'expires_in_hours' => 168,
            ],
            [
                'title' => 'Mestre Barista',
                'description' => 'Prepare 3 receitas de café nesta semana',
                'icon' => '🧑‍🍳',
                'type' => 'weekly',
                'conditions' => ['action' => 'read_recipe', 'target' => 3],
                'grain_reward' => 40,
                'expires_in_hours' => 168,
            ],
            [
                'title' => 'Diversidade de Conhecimento',
                'description' => 'Explore 5 categorias diferentes na semana',
                'icon' => '🎯',
                'type' => 'weekly',
                'conditions' => ['action' => 'explore_category', 'target' => 5],
                'grain_reward' => 40,
                'expires_in_hours' => 168,
            ],
        ];

        foreach ($missions as $mission) {
            // Idempotente: re-seedar não duplica missões existentes
            Mission::updateOrCreate(['title' => $mission['title']], $mission);
        }
    }
}
