<?php

namespace Database\Seeders;

use App\Models\Recipe;
use App\Models\RecipeCategory;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Seeder;

class RecipeSeeder extends Seeder
{
    public function run(): void
    {
        $author = User::where('role', 'admin')->first() ?? User::first();

        $recipes = [
            [
                'title' => 'Café Coado Perfeito na Garrafa Térmica',
                'slug' => 'cafe-coado-perfeito-na-garrafa-termica',
                'excerpt' => 'O método coado é o mais tradicional do Brasil. Aprenda a extrair um café equilibrado, doce e sem amargor.',
                'description' => 'Um bom café coado começa antes do fogo: na escolha dos grãos, na moagem e na água. Com esse passo a passo, você extrai o melhor do seu café todos os dias.',
                'ingredients' => [
                    ['name' => 'Café especial torrado', 'amount' => '30', 'unit' => 'g'],
                    ['name' => 'Água filtrada', 'amount' => '500', 'unit' => 'ml'],
                    ['name' => 'Filtro de papel', 'amount' => '1', 'unit' => 'un'],
                ],
                'steps' => [
                    'Ferva a água e aguarde 30 segundos para que ela atinja cerca de 92 °C.',
                    'Dobre o filtro de papel e encaixe no porta-filtro. Umedeça o filtro com um pouco de água quente e descarte.',
                    'Moagem média (textura de açúcar cristal). Adicione o pó ao filtro e nivele.',
                    'Despeje a água em movimentos circulares, começando pelo centro. Faça o "pré-infusão" com cerca de 60 ml de água e aguarde 30 segundos.',
                    'Continue despejando a água em pequenas porções até completar 500 ml.',
                    'Espere o café terminar de escorrer e sirva na garrafa térmica. Pronto!',
                ],
                'prep_time_minutes' => 10,
                'cook_time_minutes' => 0,
                'servings' => 4,
                'difficulty' => 'facil',
                'is_featured' => true,
                'is_cafe_do_dia' => true,
                'status' => 'published',
                'category_slug' => 'cafe',
                'tags' => ['coado', 'tradicional', 'café especial'],
            ],
            [
                'title' => 'Capuccino Cremoso Caseiro',
                'slug' => 'capuccino-cremoso-caseiro',
                'excerpt' => 'Espuma aveludada e sabor equilibrado: o capuccino perfeito sem sair de casa.',
                'description' => 'Com café forte, leite vaporizado e uma espuma macia, você reproduz o capuccino da cafeteria na sua cozinha.',
                'ingredients' => [
                    ['name' => 'Café espresso ou coado forte', 'amount' => '60', 'unit' => 'ml'],
                    ['name' => 'Leite integral', 'amount' => '200', 'unit' => 'ml'],
                    ['name' => 'Cacau em pó', 'amount' => '1', 'unit' => 'colher de chá'],
                    ['name' => 'Açúcar a gosto', 'amount' => '1', 'unit' => 'colher de chá'],
                ],
                'steps' => [
                    'Prepare 60 ml de café espresso (ou coado bem concentrado).',
                    'Aqueça o leite até ~65 °C e bata com um fuê ou na espumadeira até formar microespuma.',
                    'Despeje o leite sobre o café segurando a espuma com uma colher.',
                    'Finalize com a espuma por cima e polvilhe cacau em pó.',
                ],
                'prep_time_minutes' => 12,
                'cook_time_minutes' => 2,
                'servings' => 1,
                'difficulty' => 'facil',
                'is_featured' => true,
                'is_cafe_do_dia' => false,
                'status' => 'published',
                'category_slug' => 'bebidas',
                'tags' => ['capuccino', 'cremoso', 'espresso'],
            ],
            [
                'title' => 'Café Gelado com Leite de Amêndoas',
                'slug' => 'cafe-gelado-com-leite-de-amendoas',
                'excerpt' => 'Refrescante, suave e perfeito para os dias quentes. Um cold coffee com toque de canela.',
                'description' => 'Cold brew ou café coado gelado com leite vegetal: uma bebida refrescante e fácil de preparar em casa.',
                'ingredients' => [
                    ['name' => 'Café coado gelado (ou cold brew)', 'amount' => '150', 'unit' => 'ml'],
                    ['name' => 'Leite de amêndoas', 'amount' => '100', 'unit' => 'ml'],
                    ['name' => 'Gelo', 'amount' => '1', 'unit' => 'xícara'],
                    ['name' => 'Canela em pó', 'amount' => '1', 'unit' => 'pitada'],
                ],
                'steps' => [
                    'Prepare o café coado e deixe esfriar (ou use cold brew pronto).',
                    'Encha um copo alto com gelo.',
                    'Despeje o café gelado e complete com o leite de amêndoas.',
                    'Polvilhe canela e mexa delicadamente antes de servir.',
                ],
                'prep_time_minutes' => 5,
                'cook_time_minutes' => 0,
                'servings' => 1,
                'difficulty' => 'facil',
                'is_featured' => false,
                'is_cafe_do_dia' => true,
                'status' => 'published',
                'category_slug' => 'cafe-gelado',
                'tags' => ['gelado', 'leite vegetal', 'verão'],
            ],
            [
                'title' => 'Pão de Queijo de Liquidificador',
                'slug' => 'pao-de-queijo-de-liquidificador',
                'excerpt' => 'Rápido, prático e irresistível: o acompanhamento perfeito para o café da tarde.',
                'description' => 'A receita clássica de pão de queijo mineiro, sem amassar e sem sovar — tudo no liquidificador.',
                'ingredients' => [
                    ['name' => 'Polvilho azedo', 'amount' => '500', 'unit' => 'g'],
                    ['name' => 'Queijo minas ralado', 'amount' => '200', 'unit' => 'g'],
                    ['name' => 'Leite', 'amount' => '250', 'unit' => 'ml'],
                    ['name' => 'Óleo', 'amount' => '100', 'unit' => 'ml'],
                    ['name' => 'Ovos', 'amount' => '2', 'unit' => 'un'],
                    ['name' => 'Sal', 'amount' => '1', 'unit' => 'colher de chá'],
                ],
                'steps' => [
                    'Bata no liquidificador o leite, o óleo, os ovos e o sal até homogeneizar.',
                    'Adicione o polvilho aos poucos, batendo até formar uma massa lisa.',
                    'Acrescente o queijo ralado e misture com uma colher.',
                    'Modele bolinhas e disponha em uma assadeira untada.',
                    'Asse em forno preaquecido a 200 °C por 20–25 minutos até dourar.',
                ],
                'prep_time_minutes' => 15,
                'cook_time_minutes' => 25,
                'servings' => 30,
                'difficulty' => 'media',
                'is_featured' => false,
                'is_cafe_do_dia' => false,
                'status' => 'published',
                'category_slug' => 'acompanhamentos',
                'tags' => ['pão de queijo', 'mineiro', 'lanche'],
            ],
            [
                'title' => 'Brigadeiro de Café',
                'slug' => 'brigadeiro-de-cafe',
                'excerpt' => 'O doce mais brasileiro ganha um toque de café: sofisticado e delicioso.',
                'description' => 'Uma versão do clássico brigadeiro com infusão de café solúvel. Perfeito para servir com um espresso.',
                'ingredients' => [
                    ['name' => 'Leite condensado', 'amount' => '1', 'unit' => 'lata'],
                    ['name' => 'Chocolate em pó 50%', 'amount' => '3', 'unit' => 'colheres de sopa'],
                    ['name' => 'Café solúvel', 'amount' => '1', 'unit' => 'colher de sopa'],
                    ['name' => 'Manteiga', 'amount' => '1', 'unit' => 'colher de sopa'],
                    ['name' => 'Granulado', 'amount' => '100', 'unit' => 'g'],
                ],
                'steps' => [
                    'Dissolva o café solúvel em 1 colher de água quente.',
                    'Em uma panela, misture leite condensado, chocolate, café e manteiga.',
                    'Cozinhe em fogo médio, mexendo sempre, até desgrudar do fundo (~10 min).',
                    'Deixe esfriar, enrole os brigadeiros e passe no granulado.',
                ],
                'prep_time_minutes' => 20,
                'cook_time_minutes' => 10,
                'servings' => 20,
                'difficulty' => 'media',
                'is_featured' => false,
                'is_cafe_do_dia' => false,
                'status' => 'published',
                'category_slug' => 'doces',
                'tags' => ['brigadeiro', 'chocolate', 'doce'],
            ],
        ];

        foreach ($recipes as $data) {
            $category = RecipeCategory::where('slug', $data['category_slug'])->first();
            $tags = $data['tags'];

            unset($data['category_slug'], $data['tags']);

            // Idempotente: re-seedar atualiza em vez de duplicar
            $recipe = Recipe::updateOrCreate(['slug' => $data['slug']], array_merge($data, [
                'category_id' => $category?->id,
                'user_id' => $author?->id,
                'published_at' => now(),
                'meta' => [
                    'title' => $data['title'].' — Receita | Artigo com Café',
                    'description' => $data['excerpt'],
                ],
            ]));

            foreach ($tags as $tagName) {
                $tag = Tag::firstOrCreate(['name' => $tagName], ['slug' => \Illuminate\Support\Str::slug($tagName)]);
                $recipe->tags()->syncWithoutDetaching([$tag->id]);
            }
        }
    }
}
