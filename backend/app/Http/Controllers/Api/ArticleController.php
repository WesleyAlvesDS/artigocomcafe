<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Category;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArticleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Article::published()
            ->with(['category:id,name,slug,icon,color', 'tags:id,name,slug']);

        if ($request->category) {
            $query->whereHas('category', fn($q) => $q->where('slug', $request->category));
        }

        if ($request->tag) {
            $query->whereHas('tags', fn($q) => $q->where('slug', $request->tag));
        }

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('excerpt', 'like', "%{$search}%");
            });
        }

        if ($request->featured) {
            $query->featured();
        }

        $sortField = match ($request->sort) {
            'popular' => 'views_count',
            'oldest' => 'published_at',
            default => 'published_at',
        };
        $sortDir = $request->sort === 'oldest' ? 'asc' : 'desc';

        $articles = $query->orderBy($sortField, $sortDir)
            ->paginate($request->per_page ?? 12);

        return response()->json($articles);
    }

    public function show(string $slug): JsonResponse
    {
        $article = Article::published()
            ->with(['category', 'tags', 'author:id,name,username,avatar'])
            ->where('slug', $slug)
            ->firstOrFail();

        $article->increment('views_count');
        $tagIds = $article->tags->pluck('id')->toArray();

        $selectFields = ['id', 'title', 'slug', 'excerpt', 'cover_image', 'reading_time', 'published_at', 'category_id'];

        // Priority 1: Same category articles
        $related = Article::published()
            ->with('category:id,name,slug')
            ->where('id', '!=', $article->id)
            ->where('category_id', $article->category_id)
            ->orderBy('published_at', 'desc')
            ->limit(4)
            ->get($selectFields);

        // Priority 2: If not enough, add articles with shared tags
        if ($related->count() < 4 && !empty($tagIds)) {
            $existingIds = $related->pluck('id')->push($article->id);
            $tagRelated = Article::published()
                ->with('category:id,name,slug')
                ->whereNotIn('id', $existingIds)
                ->whereHas('tags', fn($q) => $q->whereIn('tags.id', $tagIds))
                ->orderBy('published_at', 'desc')
                ->limit(4 - $related->count())
                ->get($selectFields);
            $related = $related->concat($tagRelated);
        }

        // Priority 3: Fallback to most recent articles
        if ($related->count() < 4) {
            $existingIds = $related->pluck('id')->push($article->id);
            $recent = Article::published()
                ->with('category:id,name,slug')
                ->whereNotIn('id', $existingIds)
                ->orderBy('published_at', 'desc')
                ->limit(4 - $related->count())
                ->get($selectFields);
            $related = $related->concat($recent);
        }

        return response()->json([
            'article' => $article,
            'related' => $related,
        ]);
    }

    public function cafeDoDia(): JsonResponse
    {
        $article = Article::published()
            ->with(['category', 'tags'])
            ->cafeDoDia()
            ->first();

        if (!$article) {
            $article = Article::published()
                ->with(['category', 'tags'])
                ->inRandomOrder()
                ->first();
        }

        return response()->json(['article' => $article]);
    }

    public function featured(): JsonResponse
    {
        $articles = Article::published()
            ->with(['category:id,name,slug'])
            ->featured()
            ->orderBy('published_at', 'desc')
            ->take(6)
            ->get();

        return response()->json(['articles' => $articles]);
    }

    public function popular(): JsonResponse
    {
        $articles = Article::published()
            ->with(['category:id,name,slug'])
            ->orderBy('views_count', 'desc')
            ->take(6)
            ->get();

        return response()->json(['articles' => $articles]);
    }

    public function categories(): JsonResponse
    {
        $categories = Category::where('is_active', true)
            ->withCount(['articles' => fn($q) => $q->where('status', 'published')])
            ->orderBy('order')
            ->get();

        return response()->json(['categories' => $categories]);
    }

    /**
     * List existing tags for autocomplete in the editor.
     */
    public function tags(): JsonResponse
    {
        $tags = Tag::query()
            ->withCount(['articles' => fn($q) => $q->where('status', 'published')])
            ->orderBy('name')
            ->limit(200)
            ->get(['id', 'name', 'slug']);

        return response()->json(['tags' => $tags]);
    }
}
