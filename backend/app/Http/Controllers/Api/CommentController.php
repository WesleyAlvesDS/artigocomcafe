<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Comment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    public function index(Request $request, Article $article): JsonResponse
    {
        $comments = $article->comments()
            ->whereNull('parent_id')
            ->where('is_approved', true)
            ->with(['user:id,name', 'replies.user:id,name'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['comments' => $comments]);
    }

    public function store(Request $request, Article $article): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:2000',
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        $comment = $article->comments()->create([
            'user_id' => $user->id,
            'parent_id' => $validated['parent_id'] ?? null,
            'content' => $validated['content'],
            'is_approved' => true,
        ]);

        $comment->load('user:id,name');

        return response()->json(['comment' => $comment], 201);
    }

    public function like(Request $request, Comment $comment): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $comment->increment('likes_count');

        return response()->json(['likes_count' => $comment->fresh()->likes_count]);
    }
}
