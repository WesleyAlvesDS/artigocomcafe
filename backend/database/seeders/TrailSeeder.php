<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Trail;
use Illuminate\Database\Seeder;

class TrailSeeder extends Seeder
{
    public function run(): void
    {
        // Trail 1: Sustentabilidade & Vida Prática
        $trail1 = Trail::create([
            'title' => 'Vida Sustentável',
            'slug' => 'vida-sustentavel',
            'description' => 'Aprenda práticas sustentáveis para o dia a dia: economia doméstica, jardinagem orgânica e cuidados naturais.',
            'icon' => '🌱',
            'color' => '#22c55e',
            'difficulty' => 'iniciante',
            'estimated_hours' => 3,
            'grain_reward' => 50,
            'is_active' => true,
        ]);

        $this->attachArticles($trail1, [
            'casca-de-ovo-nas-plantas-calcio-soluvel-knf' => ['order' => 1, 'is_required' => true],
            'sabao-liquido-caseiro-20-litros-receita-economica-rende-muito-e-pode-reduzir-seus-gastos-domesticos' => ['order' => 2, 'is_required' => true],
            'o-que-e-aloina-babosa-como-retirar-toxicidade' => ['order' => 3, 'is_required' => true],
            '7-truques-caseiros-inteligentes-para-o-lar-que-economizam-dinheiro' => ['order' => 4, 'is_required' => false],
        ]);

        // Trail 2: Ciência & Descobertas
        $trail2 = Trail::create([
            'title' => 'Ciência do Cotidiano',
            'slug' => 'ciencia-do-cotidiano',
            'description' => 'Descubra a ciência por trás dos fenômenos do dia a dia: da genética à geopolítica ambiental.',
            'icon' => '🔬',
            'color' => '#3b82f6',
            'difficulty' => 'intermediario',
            'estimated_hours' => 4,
            'grain_reward' => 75,
            'is_active' => true,
        ]);

        $this->attachArticles($trail2, [
            'experimento-dos-gatos-no-presidio-reabilitacao-forense' => ['order' => 1, 'is_required' => true],
            'como-se-formam-impressoes-digitais-unicidade-ciencia' => ['order' => 2, 'is_required' => true],
            'paineis-solares-saara-impacto-amazonia-geoengenharia' => ['order' => 3, 'is_required' => true],
            'bem-vindo-ao-artigocomcafe-sua-pausa-para-o-conhecimento' => ['order' => 4, 'is_required' => false],
        ]);

        // Trail 3: Beleza Natural & Autocuidado
        $trail3 = Trail::create([
            'title' => 'Beleza Natural',
            'slug' => 'beleza-natural',
            'description' => 'Domine técnicas de beleza natural com ingredientes acessíveis: hidratantes, sabonetes e cuidados com a pele.',
            'icon' => '🌸',
            'color' => '#ec4899',
            'difficulty' => 'iniciante',
            'estimated_hours' => 3,
            'grain_reward' => 50,
            'is_active' => true,
        ]);

        $this->attachArticles($trail3, [
            'como-fazer-hidratante-caseiro-babosa-seguro' => ['order' => 1, 'is_required' => true],
            'o-que-e-aloina-babosa-como-retirar-toxicidade' => ['order' => 2, 'is_required' => true],
            '10-produtos-aleatorios-da-shopee-que-realmente-funcionam' => ['order' => 3, 'is_required' => true],
            '7-truques-caseiros-inteligentes-para-o-lar-que-economizam-dinheiro' => ['order' => 4, 'is_required' => false],
        ]);
    }

    private function attachArticles(Trail $trail, array $articles): void
    {
        foreach ($articles as $slug => $pivot) {
            $article = Article::where('slug', $slug)->first();
            if ($article) {
                $trail->articles()->attach($article->id, $pivot);
            }
        }
    }
}
