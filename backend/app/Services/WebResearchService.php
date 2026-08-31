<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use DOMDocument;
use DOMXPath;

/**
 * Motor de busca básico via Scraper (Web Research).
 * Busca no Google, extrai links e faz scraping dos conteúdos.
 */
class WebResearchService
{
    public function search(string $query, int $limit = 3): array
    {
        // Busca simplificada via scraping de resultados do Google
        $url = 'https://www.google.com/search?q=' . urlencode($query);
        
        $resp = Http::withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        ])->get($url);

        if (!$resp->successful()) return [];

        $html = $resp->body();
        $dom = new DOMDocument();
        @$dom->loadHTML($html);
        $xpath = new DOMXPath($dom);

        $results = [];
        $nodes = $xpath->query('//div[@class="tF2Cxc"]//a');

        foreach ($nodes as $node) {
            if (count($results) >= $limit) break;
            $url = $node->getAttribute('href');
            if (str_starts_with($url, 'http')) {
                $results[] = [
                    'url' => $url,
                    'title' => $node->nodeValue,
                    'content' => $this->scrapeContent($url)
                ];
            }
        }

        return $results;
    }

    protected function scrapeContent(string $url): string
    {
        try {
            $html = Http::timeout(5)->get($url)->body();
            $dom = new DOMDocument();
            @$dom->loadHTML($html);
            $xpath = new DOMXPath($dom);
            
            // Extrai parágrafos principais
            $text = '';
            foreach ($xpath->query('//p') as $p) {
                $text .= $p->nodeValue . ' ';
            }
            return substr($text, 0, 1500);
        } catch (\Throwable) {
            return '';
        }
    }
}
