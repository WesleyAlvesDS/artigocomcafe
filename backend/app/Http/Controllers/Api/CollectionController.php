<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Collection;
use App\Models\Recipe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CollectionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $collections = $request->user()->collections()
            ->withCount('articles')
            ->get();

        return response()->json(['collections' => $collections]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:7',
            'is_public' => 'boolean',
        ]);

        $validated['user_id'] = $request->user()->id;
        $collection = Collection::create($validated);

        return response()->json(['collection' => $collection], 201);
    }

    public function show(Request $request, Collection $collection): JsonResponse
    {
        if ($collection->user_id !== $request->user()->id && !$collection->is_public) {
            abort(403);
        }

        $collection->load(['articles' => function ($q) {
            $q->published()->with(['category:id,name,slug']);
        }]);

        return response()->json(['collection' => $collection]);
    }

    public function update(Request $request, Collection $collection): JsonResponse
    {
        if ($collection->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'description' => 'nullable|string|max:500',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:7',
            'is_public' => 'boolean',
        ]);

        $collection->update($validated);

        return response()->json(['collection' => $collection]);
    }

    public function destroy(Request $request, Collection $collection): JsonResponse
    {
        if ($collection->user_id !== $request->user()->id) {
            abort(403);
        }

        $collection->delete();

        return response()->json(['message' => 'Coleção removida.']);
    }

    public function addArticle(Request $request, Collection $collection): JsonResponse
    {
        if ($collection->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'article_id' => 'required|exists:articles,id',
            'note' => 'nullable|string|max:500',
        ]);

        if ($collection->articles()->where('article_id', $validated['article_id'])->exists()) {
            return response()->json(['message' => 'Artigo já está na coleção.'], 409);
        }

        $collection->articles()->attach($validated['article_id'], [
            'note' => $validated['note'] ?? null,
        ]);

        return response()->json(['message' => 'Artigo adicionado à coleção.']);
    }

    public function removeArticle(Request $request, Collection $collection, $articleId): JsonResponse
    {
        if ($collection->user_id !== $request->user()->id) {
            abort(403);
        }

        $collection->articles()->detach($articleId);

        return response()->json(['message' => 'Artigo removido da coleção.']);
    }

    public function saveToLibrary(Request $request, $articleId): JsonResponse
    {
        $article = Article::findOrFail($articleId);

        $collection = $request->user()->collections()->firstOrCreate(
            ['name' => 'Minha Biblioteca'],
            ['description' => 'Artigos salvos automaticamente', 'icon' => '📚', 'color' => '#8b5a2b']
        );

        if (!$collection->articles()->where('article_id', $articleId)->exists()) {
            $collection->articles()->attach($articleId);
        }

        return response()->json([
            'message' => 'Artigo salvo na biblioteca.',
            'collection' => $collection,
        ]);
    }

    public function saveRecipeToLibrary(Request $request, Recipe $recipe): JsonResponse
    {
        $collection = $request->user()->collections()->firstOrCreate(
            ['name' => 'Minha Biblioteca'],
            ['description' => 'Conteúdos salvos automaticamente', 'icon' => '📚', 'color' => '#8b5a2b']
        );

        if (! $collection->recipes()->where('recipe_id', $recipe->id)->exists()) {
            $collection->recipes()->attach($recipe->id);
        }

        return response()->json([
            'message' => 'Receita salva na biblioteca.',
            'collection' => $collection,
        ]);
    }

    public function myRecipeLibrary(Request $request): JsonResponse
    {
        $recipeIds = $request->user()->collections()
            ->with('recipes')
            ->get()
            ->pluck('recipes')
            ->flatten()
            ->pluck('id')
            ->unique();

        $recipes = Recipe::published()
            ->with(['category:id,name,slug,icon,color'])
            ->whereIn('id', $recipeIds)
            ->orderBy('published_at', 'desc')
            ->paginate(12);

        return response()->json($recipes);
    }

    public function myLibrary(Request $request): JsonResponse
    {
        $articleIds = $request->user()->collections()
            ->with('articles')
            ->get()
            ->pluck('articles')
            ->flatten()
            ->pluck('id')
            ->unique();

        $articles = Article::published()
            ->with(['category:id,name,slug'])
            ->whereIn('id', $articleIds)
            ->orderBy('published_at', 'desc')
            ->paginate(12);

        return response()->json($articles);
    }
}
