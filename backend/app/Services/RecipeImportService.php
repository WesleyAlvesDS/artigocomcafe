<?php

namespace App\Services;

use App\Models\Recipe;
use App\Models\RecipeCategory;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Importa receitas a partir de um arquivo JSON gerado por
 * backend/scripts/fetch-mealdb.mjs (TheMealDB + TheCocktailDB, CC-BY-NC).
 */
class RecipeImportService
{
    /**
     * @param  string  $filePath  Caminho absoluto do arquivo JSON.
     * @return array{created: int, updated: int, skipped: int, categories: int}
     */
    public function import(string $filePath): array
    {
        if (! file_exists($filePath)) {
            throw new \RuntimeException("Arquivo de receitas não encontrado: {$filePath}");
        }

        $payload = json_decode((string) file_get_contents($filePath), true);
        if (! is_array($payload) || empty($payload['recipes'])) {
            throw new \RuntimeException('JSON de receitas vazio ou inválido.');
        }

        $author = User::where('role', 'admin')->first() ?? User::first();

        $categoryCount = $this->importCategories($payload['categories'] ?? []);
        $created = 0;
        $updated = 0;
        $skipped = 0;

        foreach ($payload['recipes'] as $index => $data) {
            $slug = Str::slug((string) ($data['slug'] ?? ''));
            $title = trim((string) ($data['title'] ?? ''));
            if ($slug === '' || $title === '') {
                $skipped++;
                continue;
            }

            $category = RecipeCategory::where('slug', $data['category_slug'] ?? '')->first();
            $steps = $this->normalizeSteps($data['steps'] ?? []);
            $ingredients = $this->normalizeIngredients($data['ingredients'] ?? []);
            $difficulty = in_array($data['difficulty'] ?? '', ['facil', 'media', 'dificil'], true)
                ? $data['difficulty']
                : 'facil';

            $recipe = Recipe::updateOrCreate(['slug' => $slug], [
                'title' => $title,
                'excerpt' => $this->nullIfBlank($data['excerpt'] ?? null),
                'description' => $this->nullIfBlank($data['description'] ?? null),
                'ingredients' => $ingredients,
                'steps' => $steps,
                'prep_time_minutes' => isset($data['prep_time_minutes']) ? (int) $data['prep_time_minutes'] : null,
                'cook_time_minutes' => isset($data['cook_time_minutes']) ? (int) $data['cook_time_minutes'] : null,
                'servings' => max(1, (int) ($data['servings'] ?? 1)),
                'difficulty' => $difficulty,
                'cover_image' => $this->nullIfBlank($data['cover_image'] ?? null),
                'category_id' => $category?->id,
                'user_id' => $author?->id,
                'status' => 'published',
                'meta' => $this->buildMeta($data, $title),
                'published_at' => $this->publishedAt($index),
            ]);

            if ($recipe->wasRecentlyCreated) {
                $created++;
            } else {
                $updated++;
            }

            $tagIds = [];
            foreach ($data['tags'] ?? [] as $tagName) {
                $name = trim((string) $tagName);
                if ($name === '') {
                    continue;
                }
                $tag = Tag::firstOrCreate(
                    ['slug' => Str::slug($name)],
                    ['name' => $name]
                );
                $tagIds[] = $tag->id;
            }
            $recipe->tags()->sync($tagIds);
        }

        return [
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
            'categories' => $categoryCount,
        ];
    }

    private function importCategories(array $categories): int
    {
        $count = 0;
        foreach ($categories as $cat) {
            $slug = Str::slug((string) ($cat['slug'] ?? ''));
            if ($slug === '') {
                continue;
            }
            RecipeCategory::updateOrCreate(['slug' => $slug], [
                'name' => trim((string) ($cat['name'] ?? $slug)),
                'icon' => $this->nullIfBlank($cat['icon'] ?? null),
                'color' => $this->nullIfBlank($cat['color'] ?? null),
                'order' => (int) ($cat['order'] ?? 99),
                'is_active' => true,
            ]);
            $count++;
        }

        return $count;
    }

    private function normalizeIngredients(array $ingredients): array
    {
        $out = [];
        foreach ($ingredients as $ing) {
            $name = trim((string) ($ing['name'] ?? ''));
            if ($name === '') {
                continue;
            }
            $out[] = [
                'name' => $name,
                'amount' => $this->nullIfBlank($ing['amount'] ?? null),
                'unit' => $this->nullIfBlank($ing['unit'] ?? null),
                'optional' => (bool) ($ing['optional'] ?? false),
            ];
        }

        return $out;
    }

    private function normalizeSteps(array $steps): array
    {
        $out = [];
        foreach ($steps as $step) {
            if (is_string($step)) {
                $step = ['description' => $step];
            }
            $text = trim((string) ($step['description'] ?? ''));
            if ($text !== '') {
                $out[] = ['description' => $text];
            }
        }

        return $out;
    }

    private function buildMeta(array $data, string $title): array
    {
        $excerpt = trim((string) ($data['excerpt'] ?? ''));

        return [
            'title' => mb_substr($title.' — Receita | Artigo com Café', 0, 70),
            'description' => mb_substr($excerpt !== '' ? $excerpt : $title, 0, 200),
            'cuisine' => $this->nullIfBlank($data['cuisine'] ?? ($data['meta']['cuisine'] ?? null)),
            'source' => $this->nullIfBlank($data['source'] ?? ($data['meta']['source'] ?? null)),
            'source_url' => $this->nullIfBlank($data['source_url'] ?? ($data['meta']['source_url'] ?? null)),
        ];
    }

    private function publishedAt(int $index): string
    {
        // Estagela as datas para manter uma ordem estável de publicação
        // (novo > antigo no feed) e simular "publicações recentes".
        return now()->subMinutes($index)->toDateTimeString();
    }

    private function nullIfBlank(mixed $value): ?string
    {
        $v = is_string($value) ? trim($value) : $value;

        return ($v === null || $v === '') ? null : (string) $v;
    }
}
