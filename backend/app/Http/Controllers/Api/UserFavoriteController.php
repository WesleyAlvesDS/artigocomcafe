<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserFavoriteController extends Controller
{
    /**
     * Lista as categorias favoritas do usuário + catálogo completo (para a UI).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $favoriteSlugs = array_values(array_filter(
            $user->favorite_categories ?? [],
            fn ($s) => is_string($s) && $s !== ''
        ));

        $favorites = collect();
        if (!empty($favoriteSlugs)) {
            $field = 'FIELD(slug, ' . implode(',', array_map(fn ($s) => "'" . addslashes($s) . "'", $favoriteSlugs)) . ')';
            $favorites = Category::where('is_active', true)
                ->whereIn('slug', $favoriteSlugs)
                ->orderByRaw($field)
                ->get(['id', 'name', 'slug', 'icon', 'color']);
        }

        $all = Category::where('is_active', true)
            ->orderBy('order')
            ->get(['id', 'name', 'slug', 'icon', 'color']);

        return response()->json([
            'favorites' => $favorites,
            'categories' => $all,
        ]);
    }

    /**
     * Substitui a lista de categorias favoritas (ex.: [\"tecnologia\", \"financas\"]).
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slugs' => 'present|array',
            'slugs.*' => 'string|max:100',
        ]);

        $slugs = array_values(array_unique(array_map('trim', $validated['slugs'])));

        // Garante que só categorias reais sejam salvas.
        $existing = Category::whereIn('slug', $slugs)->pluck('slug')->all();
        $slugs = array_values(array_intersect($slugs, $existing));

        $request->user()->update(['favorite_categories' => $slugs]);

        $favorites = collect();
        if (!empty($slugs)) {
            $field = 'FIELD(slug, ' . implode(',', array_map(fn ($s) => "'" . addslashes($s) . "'", $slugs)) . ')';
            $favorites = Category::where('is_active', true)
                ->whereIn('slug', $slugs)
                ->orderByRaw($field)
                ->get(['id', 'name', 'slug', 'icon', 'color']);
        }

        return response()->json(['favorites' => $favorites]);
    }
}
