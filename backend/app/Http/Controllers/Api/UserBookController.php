<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserBook;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserBookController extends Controller
{
    /**
     * Lista os livros salvos do usuário, opcionalmente filtrados por prateleira.
     *
     * Query params: shelf (quero_ler | lidos | favoritos), per_page
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->userBooks();

        if ($shelf = $request->query('shelf')) {
            if (! in_array($shelf, UserBook::SHELVES, true)) {
                return response()->json(['error' => 'Prateleira inválida.'], 422);
            }
            $query->where('shelf', $shelf);
        }

        $books = $query
            ->orderByRaw("FIELD(shelf, 'quero_ler', 'lidos', 'favoritos'), updated_at desc")
            ->get();

        $counts = [];
        foreach (UserBook::SHELVES as $value) {
            $counts[$value] = $request->user()->userBooks()->where('shelf', $value)->count();
        }

        return response()->json([
            'books' => $books,
            'counts' => $counts,
        ]);
    }

    /**
     * Salva um livro na biblioteca do usuário (upsert por ol_key).
     *
     * Body: ol_key, title, subtitle?, authors?, first_publish_year?, cover_id?,
     *       covers?, isbn?, rating_avg?, rating_count?, shelf
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ol_key' => ['required', 'string', 'max:64'],
            'title' => ['required', 'string', 'max:500'],
            'subtitle' => ['nullable', 'string', 'max:500'],
            'authors' => ['nullable', 'array'],
            'authors.*' => ['string', 'max:255'],
            'first_publish_year' => ['nullable', 'integer', 'min:1000', 'max:2100'],
            'cover_id' => ['nullable', 'integer'],
            'covers' => ['nullable', 'array'],
            'isbn' => ['nullable', 'array'],
            'isbn.*' => ['string', 'max:40'],
            'rating_avg' => ['nullable', 'numeric', 'min:0', 'max:5'],
            'rating_count' => ['nullable', 'integer', 'min:0'],
            'shelf' => ['required', Rule::in(UserBook::SHELVES)],
        ]);

        // Mesma normalização do frontend: "works/OL1234567W" -> "OL1234567W"
        $olKey = Str::afterLast(trim($validated['ol_key'], '/'), '/');

        $book = $request->user()->userBooks()->updateOrCreate(
            ['ol_key' => $olKey],
            array_merge($validated, [
                'ol_key' => $olKey,
                'finished_at' => $validated['shelf'] === UserBook::SHELF_LIDOS ? now() : null,
            ])
        );

        $counts = $this->shelfCounts($request->user()->id);

        return response()->json([
            'message' => $book->wasRecentlyCreated
                ? 'Livro salvo na biblioteca.'
                : 'Livro atualizado na biblioteca.',
            'book' => $book,
            'counts' => $counts,
        ], $book->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Move um livro entre prateleiras e/ou atualiza avaliação pessoal.
     *
     * Body: shelf?, user_rating?, user_review?
     */
    public function update(Request $request, UserBook $book): JsonResponse
    {
        if ($book->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'shelf' => ['sometimes', Rule::in(UserBook::SHELVES)],
            'user_rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'user_review' => ['nullable', 'string', 'max:2000'],
        ]);

        if (array_key_exists('shelf', $validated)) {
            $validated['finished_at'] = $validated['shelf'] === UserBook::SHELF_LIDOS ? now() : null;
        }

        $book->update($validated);

        $counts = $this->shelfCounts($request->user()->id);

        return response()->json([
            'message' => 'Prateleira atualizada.',
            'book' => $book->fresh(),
            'counts' => $counts,
        ]);
    }

    /**
     * Remove um livro da biblioteca do usuário.
     */
    public function destroy(Request $request, UserBook $book): JsonResponse
    {
        if ($book->user_id !== $request->user()->id) {
            abort(403);
        }

        $book->delete();

        $counts = $this->shelfCounts($request->user()->id);

        return response()->json([
            'message' => 'Livro removido da biblioteca.',
            'counts' => $counts,
        ]);
    }

    private function shelfCounts(int $userId): array
    {
        $counts = [];
        foreach (UserBook::SHELVES as $shelf) {
            $counts[$shelf] = UserBook::where('user_id', $userId)->where('shelf', $shelf)->count();
        }
        return $counts;
    }
}
