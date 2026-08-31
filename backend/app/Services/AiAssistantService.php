<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Assistente do Criador — integração com OpenRouter.
 *
 * Consome modelos gratuitos rotativos para evitar rate-limit diário.
 * Lista atualizada de modelos gratuitos deve ser conferida em
 * https://openrouter.ai/models?max_price=0
 *
 * Config: OPENROUTER_API_KEY no .env (sk-or-v1-...)
 */
class AiAssistantService
{
    protected ?string $apiKey;

    /**
     * Lista rotativa de modelos gratuitos do OpenRouter.
     * O índice atual é persistido em cache e avança após cada erro
     * 429 (rate limit) ou 402 (créditos), garantindo rotação automática.
     */
    protected const FREE_MODELS = [
        'meta-llama/llama-3.3-70b-instruct:free',
        'meta-llama/llama-3.1-8b-instruct:free',
        'qwen/qwen-2.5-72b-instruct:free',
        'qwen/qwen-2.5-7b-instruct:free',
        'google/gemini-2.0-flash-exp:free',
        'mistralai/mistral-7b-instruct:free',
        'nousresearch/hermes-3-llama-3.1-405b:free',
    ];

    protected const CACHE_KEY = 'ai_assistant:model_index';

    public function __construct()
    {
        $this->apiKey = config('services.openrouter.key');
    }

    /**
     * Pergunta ao assistente. Tenta todos os modelos da lista rotativa
     * até receber sucesso ou esgotar as opções.
     *
     * @return array{reply: string, provider: string, model: string, tokens: int, error: bool}
     */
    public function ask(string $prompt, string $context = ''): array
    {
        if (!$this->isAvailable()) {
            return $this->failure('OpenRouter não configurado. Defina OPENROUTER_API_KEY no .env.');
        }

        $messages = $this->buildMessages($prompt, $context);
        $tried = 0;
        $total = count(self::FREE_MODELS);
        $startIndex = (int) Cache::get(self::CACHE_KEY, 0);
        $totalTokens = 0;

        // Tenta cada modelo começando pelo índice atual; após esgotar, retorna falha.
        for ($i = 0; $i < $total; $i++) {
            $index = ($startIndex + $i) % $total;
            $model = self::FREE_MODELS[$index];
            $tried++;

            $result = $this->tryModel($model, $messages);

            if ($result !== null) {
                // Sucesso — define este modelo como o próximo a ser tentado.
                Cache::forever(self::CACHE_KEY, ($index + 1) % $total);
                $result['tokens'] = $totalTokens + ($result['tokens'] ?? 0);
                return $result;
            }

            // Falha — rotaciona o índice para o próximo modelo.
            Cache::forever(self::CACHE_KEY, ($index + 1) % $total);
        }

        return $this->failure('Todos os modelos gratuitos estão temporariamente indisponíveis. Tente novamente em instantes.');
    }

    /**
     * Tenta um único modelo. Retorna null se falhar (rotaciona para o próximo).
     */
    protected function tryModel(string $model, array $messages): ?array
    {
        try {
            $resp = Http::timeout(45)
                ->withToken($this->apiKey)
                ->withHeaders([
                    'HTTP-Referer' => config('app.url'),
                    'X-Title' => 'Artigo com Café — Dashboard',
                ])
                ->asJson()
                ->post('https://openrouter.ai/api/v1/chat/completions', [
                    'model' => $model,
                    'messages' => $messages,
                    'max_tokens' => 1024,
                    'temperature' => 0.7,
                ]);

            if ($resp->successful()) {
                $body = $resp->json();
                $reply = trim($body['choices'][0]['message']['content'] ?? '');

                if ($reply !== '') {
                    return [
                        'reply' => $reply,
                        'provider' => 'openrouter',
                        'model' => $model,
                        'tokens' => (int) ($body['usage']['total_tokens'] ?? 0),
                        'error' => false,
                    ];
                }
            }

            $status = $resp->status();
            // 429 = rate limit, 402 = créditos esgotados — rotaciona.
            // Outros erros (500, 503) também rotacionam para tentar outro modelo.
            Log::warning('OpenRouter model failed', [
                'model' => $model,
                'status' => $status,
                'body' => substr((string) $resp->body(), 0, 200),
            ]);
        } catch (\Throwable $e) {
            Log::warning('OpenRouter request error', [
                'model' => $model,
                'error' => $e->getMessage(),
            ]);
        }

        return null;
    }

    public function isAvailable(): bool
    {
        return !empty($this->apiKey);
    }

    protected function buildMessages(string $prompt, string $context): array
    {
        $system = "Você é o 'Assistente do Criador', um copilot editorial especializado em café, culinária e SEO. "
            ."Analise o contexto fornecido (artigo em edição) e responda de forma concisa, prática e útil. "
            ."Quando pedir análise SEO, foque em: palavra-chave no título, meta description (140-160 chars), "
            ."estrutura de headings, legibilidade e oportunidades de rich-snippet.";

        $userMessage = $context
            ? "[Contexto do artigo em edição]\n{$context}\n\n[Solicitação do editor]\n{$prompt}"
            : $prompt;

        return [
            ['role' => 'system', 'content' => $system],
            ['role' => 'user', 'content' => $userMessage],
        ];
    }

    protected function failure(string $message): array
    {
        return [
            'reply' => $message,
            'provider' => 'openrouter',
            'model' => 'none',
            'tokens' => 0,
            'error' => true,
        ];
    }
}
