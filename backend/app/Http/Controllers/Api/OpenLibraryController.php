<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Integrations\OpenLibraryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OpenLibraryController extends Controller
{
    /**
     * Busca livros na OpenLibrary.
     *
     * Query params: q (termo), page, limit, subject
     */
    public function search(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));

        if (mb_strlen($q) < 2) {
            return response()->json([
                'error' => 'Informe pelo menos 2 caracteres para buscar.',
            ], 422);
        }

        $result = app(OpenLibraryService::class)->search(
            $q,
            (int) $request->query('page', 1),
            (int) $request->query('limit', 20),
            $request->query('subject') ? (string) $request->query('subject') : null,
        );

        if (! $result) {
            return response()->json(['error' => 'Busca indisponível no momento.'], 503);
        }

        return response()->json(['data' => $result]);
    }

    /**
     * Curadoria automática por temas (café, conhecimento, etc.).
     */
    public function explore(Request $request): JsonResponse
    {
        $result = app(OpenLibraryService::class)->explore(
            min((int) $request->query('limit', 12), 30),
        );

        if (! $result) {
            return response()->json(['error' => 'Curadoria indisponível no momento.'], 503);
        }

        return response()->json(['data' => $result]);
    }

    /**
     * Detalhes de uma work.
     *
     * Ex.: /library/books/OL1234567W
     */
    public function show(Request $request, string $key): JsonResponse
    {
        $result = app(OpenLibraryService::class)->work($key);

        if (! $result) {
            return response()->json(['error' => 'Livro não encontrado.'], 404);
        }

        return response()->json(['data' => $result]);
    }
}
