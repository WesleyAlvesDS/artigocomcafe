<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Category;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserPostController extends Controller
{
    /**
     * List the authenticated user's own articles (paginated).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $articles = Article::where('user_id', $user->id)
            ->with(['category:id,name,slug', 'tags:id,name,slug'])
            ->orderByDesc('updated_at')
            ->paginate($request->integer('per_page', 10));

        $data = $articles->map(fn (Article $a) => [
            'id' => $a->id,
            'title' => $a->title,
            'slug' => $a->slug,
            'excerpt' => $a->excerpt,
            'status' => $a->status,
            'featured_image' => $a->featured_image ?? $a->cover_image,
            'reading_time' => $a->reading_time,
            'category' => $a->category ? ['name' => $a->category->name, 'slug' => $a->category->slug] : null,
            'tags' => $a->tags->map(fn ($t) => ['name' => $t->name, 'slug' => $t->slug])->values(),
            'meta_description' => $a->meta['meta_description'] ?? null,
            'date' => $a->published_at?->toDateString() ?? $a->created_at->toDateString(),
            'created_at' => $a->created_at->toISOString(),
            'updated_at' => $a->updated_at->toISOString(),
        ]);

        // O widget "Meus Artigos" do dashboard lê `res.data.data` e
        // `res.data.meta.*`, então a resposta é embrulhada em `data`.
        return response()->json([
            'data' => [
                'data' => $data,
                'meta' => [
                    'current_page' => $articles->currentPage(),
                    'last_page' => $articles->lastPage(),
                    'per_page' => $articles->perPage(),
                    'total' => $articles->total(),
                ],
            ],
        ]);
    }

    /**
     * Upload an image for an article (returns a public URL).
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image' => 'required|image|mimes:jpeg,jpg,png,webp,gif|max:5120',
        ]);

        $file = $validated['image'];
        $user = $request->user();
        $safe = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'imagem';
        $name = time() . '_' . $safe . '.' . $file->getClientOriginalExtension();
        $path = 'uploads/' . $user->id . '/' . $name;

        Storage::disk('public')->putFileAs(dirname($path), $file, basename($path));

        return response()->json([
            'url' => config('app.url') . '/storage/' . $path,
        ]);
    }

    /**
     * Create a new article owned by the authenticated user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('articles', 'slug')->whereNull('deleted_at')],
            'excerpt' => 'nullable|string|max:500',
            'content' => 'nullable|string',
            'status' => 'sometimes|string|in:draft,review,scheduled,published,archived',
            'category' => 'nullable|array',
            'category.name' => 'nullable|string|max:255',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:100',
            'meta_description' => 'nullable|string|max:320',
        ]);

        $article = Article::create([
            'title' => $validated['title'],
            'slug' => $this->uniqueSlug($validated['title'], $validated['slug'] ?? null),
            'excerpt' => $validated['excerpt'] ?? null,
            'content' => $validated['content'] ?? '',
            'status' => $validated['status'] ?? 'draft',
            'user_id' => $request->user()->id,
            'category_id' => $this->resolveCategory($validated['category'] ?? null)?->id,
            'reading_time' => $this->estimateReadingTime($validated['content'] ?? ''),
            'meta' => $this->mergeMeta(null, $validated['meta_description'] ?? null),
            'published_at' => ($validated['status'] ?? 'draft') === 'published' ? now() : null,
        ]);

        $this->syncTags($article, $validated['tags'] ?? []);

        return response()->json(['article' => $this->serialize($article)], 201);
    }

    /**
     * Update one of the authenticated user's own articles.
     */
    public function update(Request $request, Article $article): JsonResponse
    {
        if ($article->user_id !== $request->user()->id) {
            abort(403, 'Você não tem permissão para editar este artigo.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('articles', 'slug')->ignore($article->id)->whereNull('deleted_at')],
            'excerpt' => 'nullable|string|max:500',
            'content' => 'nullable|string',
            'status' => 'sometimes|string|in:draft,review,scheduled,published,archived',
            'category' => 'nullable|array',
            'category.name' => 'nullable|string|max:255',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:100',
            'meta_description' => 'nullable|string|max:320',
        ]);

        $wasPublished = $article->status === 'published';

        $article->update([
            'title' => $validated['title'],
            'slug' => $this->uniqueSlug($validated['title'], $validated['slug'] ?? $article->slug, $article->id),
            'excerpt' => $validated['excerpt'] ?? null,
            'content' => $validated['content'] ?? '',
            'status' => $validated['status'] ?? $article->status,
            'category_id' => $this->resolveCategory($validated['category'] ?? null)?->id,
            'reading_time' => $this->estimateReadingTime($validated['content'] ?? ''),
            'meta' => $this->mergeMeta($article->meta, $validated['meta_description'] ?? null),
        ]);

        $newStatus = $article->status;
        if ($newStatus === 'published' && !$wasPublished && !$article->published_at) {
            $article->update(['published_at' => now()]);
        }

        $this->syncTags($article, $validated['tags'] ?? []);

        return response()->json(['article' => $this->serialize($article)]);
    }

    /**
     * Delete one of the authenticated user's own articles.
     */
    public function destroy(Request $request, Article $article): JsonResponse
    {
        if ($article->user_id !== $request->user()->id) {
            abort(403, 'Você não tem permissão para excluir este artigo.');
        }

        $article->delete();

        return response()->json(['message' => 'Artigo excluído com sucesso.']);
    }

    private function serialize(Article $article): array
    {
        $article->load(['category:id,name,slug', 'tags:id,name,slug']);

        return [
            'id' => $article->id,
            'title' => $article->title,
            'slug' => $article->slug,
            'excerpt' => $article->excerpt,
            'status' => $article->status,
            'featured_image' => $article->featured_image ?? $article->cover_image,
            'reading_time' => $article->reading_time,
            'category' => $article->category ? ['name' => $article->category->name, 'slug' => $article->category->slug] : null,
            'tags' => $article->tags->map(fn ($t) => ['name' => $t->name, 'slug' => $t->slug])->values(),
            'meta_description' => $article->meta['meta_description'] ?? null,
            'date' => $article->published_at?->toDateString() ?? $article->created_at->toDateString(),
            'created_at' => $article->created_at->toISOString(),
            'updated_at' => $article->updated_at->toISOString(),
        ];
    }

    private function uniqueSlug(string $title, ?string $preferred = null, ?int $ignoreId = null): string
    {
        $sluggedTitle = Str::slug($title) ?: 'artigo';
        $base = $preferred ? (Str::slug($preferred) ?: $sluggedTitle) : $sluggedTitle;
        $slug = $base;
        $i = 2;
        while (Article::withTrashed()->where('slug', $slug)->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = $base . '-' . $i;
            $i++;
        }

        return $slug;
    }

    private function mergeMeta(?array $existing, ?string $metaDescription): array
    {
        $meta = $existing ?? [];
        $meta['meta_description'] = $metaDescription;

        return $meta;
    }

    private function resolveCategory(?array $category): ?Category
    {
        if (!$category || empty($category['name'])) {
            return null;
        }

        $name = trim($category['name']);
        $slug = Str::slug($name);

        return Category::firstOrCreate(
            ['slug' => $slug],
            ['name' => $name, 'is_active' => true]
        );
    }

    private function syncTags(Article $article, array $tagNames): void
    {
        $ids = [];
        foreach ($tagNames as $name) {
            $name = trim((string) $name);
            if ($name === '') {
                continue;
            }
            $tag = Tag::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name]
            );
            $ids[] = $tag->id;
        }
        $article->tags()->sync($ids);
    }

    private function estimateReadingTime(string $content): int
    {
        $words = str_word_count(strip_tags($content));
        $minutes = (int) ceil($words / 200);

        return max(1, $minutes);
    }
}
