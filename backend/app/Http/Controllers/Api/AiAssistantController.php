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
     * Pergunta ao assistente do criador (POST para receber prompt + context no body).
     *
     * Body JSON: { "prompt": "string", "context": "string?" }
     *
     * @return JsonResponse
     */
    public function ask(Request $request): JsonResponse
    {
        if (! $this->ai->isAvailable()) {
            return response()->json([
                'reply' => 'Assistente de IA não configurado. Defina OPENROUTER_API_KEY no .env.',
                'provider' => 'openrouter',
                'model' => 'none',
                'tokens' => 0,
                'error' => true,
            ], 503);
        }

        $prompt = (string) $request->input('prompt');
        $context = (string) $request->input('context', '');

        if ($prompt === '') {
            return response()->json([
                'reply' => 'Prompt vazio.',
                'provider' => 'openrouter',
                'model' => 'none',
                'tokens' => 0,
                'error' => true,
            ], 422);
        }

        $result = $this->ai->ask($prompt, $context);

        return response()->json($result);
    }

    /**
     * Verifica se o assistente está disponível.
     */
    public function status(): JsonResponse
    {
        return response()->json([
            'available' => $this->ai->isAvailable(),
            'provider' => 'openrouter',
        ]);
    }
}