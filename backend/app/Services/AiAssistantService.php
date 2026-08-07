<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Assistente do Criador — integração com provedores de LLM (Groq + Gemini).
 *
 * Usado pelo dashboard para sugestões de títulos, resumos, meta-descrições
 * e respostas do assistente editorial. Tenta Groq primeiro (mais rápido),
 * depois Gemini como fallback.
 *
 * Config: GROQ_API_KEY e GEMINI_API_KEY no .env.
 */
class AiAssistantService
{
    protected ?string $groqKey;
    protected ?string $geminiKey;

    protected const MODEL_GROQ = 'llama-3.1-8b-instant';
    protected const MODEL_GEMINI = 'gemini-1.5-flash';

    public function __construct()
    {
        $this->groqKey = config('services.groq.key');
        $this->geminiKey = config('services.gemini.key');
    }

    /**
     * Pergunta ao assistente.
     *
     * @param  string  $prompt  instrução/mensagem do usuário
     * @param  string  $context  contexto opcional (ex.: resumo do artigo)
     * @return array{reply: string, provider: string, cached: bool}
     */
    public function ask(string $prompt, string $context = ''): array
    {
        $messages = $this->buildMessages($prompt, $context);

        $start = microtime(true);
        $result = $this->tryGroq($messages)
            ?? $this->tryGemini($messages)
            ?? ['reply' => 'Desculpe, não consegui me conectar ao assistente de IA no momento.', 'provider' => 'none'];

        $result['cached'] = false;
        $result['elapsed_ms'] = (int) ((microtime(true) - $start) * 1000);

        return $result;
    }

    /**
     * Verifica se algum provedor de IA está configurado.
     */
    public function isAvailable(): bool
    {
        return !empty($this->groqKey) || !empty($this->geminiKey);
    }

    protected function buildMessages(string $prompt, string $context): array
    {
        $system = "Você é o 'Assistente do Criador', um assistente de editoria especializado em café, culinária e conhecimento geral. Forneça respostas concisas e úteis no mesmo tom do Artigo com Café.";

        $userMessage = $context ? "[Contexto]\n{$context}\n\n[Pergunta]\n{$prompt}" : $prompt;

        return [
            ['role' => 'system', 'content' => $system],
            ['role' => 'user', 'content' => $userMessage],
        ];
    }

    protected function tryGroq(array $messages): ?array
    {
        if (!$this->groqKey) return null;

        try {
            $resp = Http::timeout(30)->withToken($this->groqKey)->asJson()->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => self::MODEL_GROQ,
                'messages' => $messages,
                'max_tokens' => 1024,
                'temperature' => 0.7,
            ]);

            if ($resp->successful()) {
                $body = $resp->json();
                $reply = $body['choices'][0]['message']['content'] ?? '';
                if ($reply) {
                    return ['reply' => trim($reply), 'provider' => 'groq'];
                }
            }

            Log::warning('Groq API error', ['status' => $resp->status(), 'body' => substr((string) $resp->body(), 0, 300)]);
        } catch (\Throwable $e) {
            Log::warning('Groq request failed', ['error' => $e->getMessage()]);
        }

        return null;
    }

    protected function tryGemini(array $messages): ?array
    {
        if (!$this->geminiKey) return null;

        $system = $messages[0]['content'] ?? '';
        $userMessage = $messages[1]['content'] ?? '';
        $combined = $system . "\n\n" . $userMessage;

        try {
            $resp = Http::timeout(30)->asJson()->post(
                'https://generativelanguage.googleapis.com/v1beta/models/' . self::MODEL_GEMINI . ':generateContent?key=' . $this->geminiKey,
                [
                    'contents' => [
                        ['parts' => [['text' => $combined]]],
                    ],
                    'generationConfig' => [
                        'maxOutputTokens' => 1024,
                        'temperature' => 0.7,
                    ],
                ]
            );

            if ($resp->successful()) {
                $body = $resp->json();
                $reply = $body['candidates'][0]['content']['parts'][0]['text'] ?? '';
                if ($reply) {
                    return ['reply' => trim($reply), 'provider' => 'gemini'];
                }
            }

            Log::warning('Gemini API error', ['status' => $resp->status(), 'body' => substr((string) $resp->body(), 0, 300)]);
        } catch (\Throwable $e) {
            Log::warning('Gemini request failed', ['error' => $e->getMessage()]);
        }

        return null;
    }
}
