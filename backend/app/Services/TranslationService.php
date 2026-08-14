<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Tradução automática para pt-BR — SEM chave de API.
 *
 * Usa o endpoint público do Google Translate (gtx) como primário e o
 * MyMemory como fallback. Resultados são cacheados por 30 dias (metadados
 * de livro não mudam) para não estourar limites gratuitos nem repetir
 * chamadas a cada build SSG.
 *
 * Importante: apenas traduções bem-sucedidas são cacheadas; falhas
 * transitórias caem no texto original (nunca quebram a página).
 */
class TranslationService
{
    protected const CACHE_TTL = 60 * 60 * 24 * 30; // 30 dias

    /**
     * Traduz um texto para pt-BR.
     *
     * @return string|null  texto traduzido, ou null se não houver o que traduzir
     */
    public function toPortuguese(?string $text): ?string
    {
        $clean = trim((string) $text);

        // Nada a traduzir
        if ($clean === '' || mb_strlen($clean) < 4) {
            return null;
        }

        // Textos já em português (detecção leve): não gasta chamada de API.
        if ($this->looksPortuguese($clean)) {
            return null;
        }

        $cacheKey = 'translation.pt.' . md5($clean);

        if (($cached = Cache::get($cacheKey)) !== null) {
            return is_string($cached) && $cached !== '' ? $cached : null;
        }

        $translated = $this->tryGoogle($clean) ?? $this->tryMyMemory($clean);

        if ($translated === null || $translated === '') {
            // Falha/indisponível: não cacheia, retorna original tratado como
            // "sem tradução" (null) para o chamador usar o texto original.
            return null;
        }

        // Se a API devolveu o mesmo texto, é porque já estava em pt ou é um
        // nome próprio — também não há tradução a oferecer.
        if (mb_strtolower(trim($translated)) === mb_strtolower($clean)) {
            return null;
        }

        Cache::put($cacheKey, $translated, self::CACHE_TTL);

        return $translated;
    }

    /**
     * Heurística leve para detectar português sem chamar API.
     */
    protected function looksPortuguese(string $text): bool
    {
        $lower = mb_strtolower($text);

        // Marcadores ortográficos bem comuns em pt-BR (e raros em en/de/fr...)
        $ptDiacritics = ['ã', 'õ', 'ç', 'â', 'ê', 'ô', 'á', 'é', 'í', 'ó', 'ú'];
        $score = 0;
        foreach ($ptDiacritics as $c) {
            if (mb_strpos($lower, $c) !== false) {
                $score++;
            }
        }
        if ($score >= 2) {
            return true;
        }

        // Palavras funcionais típicas do português
        $ptWords = [' o ', ' a ', ' os ', ' as ', ' de ', ' do ', ' da ', ' dos ', ' das ',
            ' para ', ' com ', ' por ', ' que ', ' como ', ' uma ', ' um ', ' mais ', ' não ',
            ' no ', ' na ', ' em ', ' ao ', ' à ', ' esta ', ' este ', ' sobre ', ' também '];
        $hits = 0;
        foreach ($ptWords as $w) {
            if (mb_strpos($lower, $w) !== false) {
                $hits++;
            }
        }

        return $hits >= 4;
    }

    /**
     * Google Translate (endpoint público gtx — sem chave).
     */
    protected function tryGoogle(string $text): ?string
    {
        try {
            $resp = Http::timeout(10)
                ->get('https://translate.googleapis.com/translate_a/single', [
                    'client' => 'gtx',
                    'sl' => 'auto',
                    'tl' => 'pt',
                    'dt' => 't',
                    'q' => mb_substr($text, 0, 4800),
                ]);

            if (! $resp->successful()) {
                return null;
            }

            $body = $resp->json();
            $segments = $body[0] ?? [];
            $out = '';
            foreach ($segments as $seg) {
                if (is_array($seg) && isset($seg[0]) && is_string($seg[0])) {
                    $out .= $seg[0];
                }
            }

            return trim($out) !== '' ? trim($out) : null;
        } catch (Throwable $e) {
            Log::debug('Tradução (Google) falhou', ['error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * MyMemory (fallback — API pública gratuita).
     */
    protected function tryMyMemory(string $text): ?string
    {
        try {
            $resp = Http::timeout(10)
                ->get('https://api.mymemory.translated.net/get', [
                    'q' => mb_substr($text, 0, 4800),
                    'langpair' => 'en|pt-BR',
                ]);

            if (! $resp->successful()) {
                return null;
            }

            $body = $resp->json();
            $status = $body['responseStatus'] ?? 500;
            if ((int) $status !== 200) {
                return null;
            }

            $translated = $body['responseData']['translatedText'] ?? '';

            return trim((string) $translated) !== '' ? trim((string) $translated) : null;
        } catch (Throwable $e) {
            Log::debug('Tradução (MyMemory) falhou', ['error' => $e->getMessage()]);

            return null;
        }
    }
}
