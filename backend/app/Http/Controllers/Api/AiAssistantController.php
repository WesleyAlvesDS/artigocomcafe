<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AiAssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiAssistantController extends Controller
{
    public function __construct(
        protected AiAssistantService $ai
    ) {}

    /**
     * Pergunta ao assistente do criador.
     *
     * Exemplo:
     *   GET /api/ai/ask?q=Como fazer pão de queijo?
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function ask(Request $request): JsonResponse
    {
        if (! $this->ai->isAvailable()) {
            return response()->json([
                'error' => 'Assistente de IA não configurado. Configure GROQ_API_KEY ou GEMINI_API_KEY.',
            ], 503);
        }

        $prompt = $request->query('q') ?: $request->input('prompt');
        $context = $request->input('context', '');

        if (! $prompt) {
            return response()->json([
                'error' => 'Parâmetro "q" ou "prompt" é obrigatório.',
            ], 422);
        }

        $result = $this->ai->ask($prompt, $context);

        return response()->json([
            'data' => $result,
        ]);
    }

    /**
     * Verifica se o assistente está disponível.
     */
    public function status(): JsonResponse
    {
        return response()->json([
            'data' => [
                'available' => $this->ai->isAvailable(),
                'providers' => [
                    'groq' => !empty(config('services.groq.key')),
                    'gemini' => !empty(config('services.gemini.key')),
                ],
            ],
        ]);
    }
}
