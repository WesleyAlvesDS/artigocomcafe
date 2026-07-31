<?php
/**
 * Storage Proxy - Artigo com Café
 *
 * Encaminha requisições de imagens de artigos (artigocomcafe.com/storage/articles/...)
 * para o backend (back.artigocomcafe.com/storage/articles/...), contornando o
 * problema de certificado SSL que não cobre o subdomínio e o fato de o frontend
 * ser estático (sem o diretório storage/ local).
 *
 * Uso: https://artigocomcafe.com/storage/articles/1/meu-artigo.png
 *      (regra de rewrite no .htaccess redireciona para este proxy)
 */

define('BACKEND_STORAGE', 'https://back.artigocomcafe.com/storage');

// Only GET/HEAD are expected for images
if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'HEAD'])) {
    http_response_code(405);
    header('Allow: GET, HEAD');
    exit;
}

$requestUri = $_SERVER['REQUEST_URI'];

// Extract the path after /storage/
$path = '';
if (preg_match('#/storage/(.*)#', $requestUri, $matches)) {
    $path = preg_replace('#[?\#].*$#', '', $matches[1]);
}

if (empty($path)) {
    http_response_code(400);
    exit;
}

// Prevent path traversal
if (strpos($path, '..') !== false) {
    http_response_code(400);
    exit;
}

$backendUrl = BACKEND_STORAGE . '/' . $path;

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $backendUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS => 5,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => 0,
    CURLOPT_ENCODING => '',
    CURLOPT_HTTPHEADER => ['Host: back.artigocomcafe.com'],
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$error = curl_error($ch);
curl_close($ch);

if ($error || $httpCode >= 500) {
    http_response_code(502);
    exit;
}

$responseHeaders = substr($response, 0, $headerSize);
$responseBody = substr($response, $headerSize);

// Forward relevant headers only (skip hop-by-hop)
$forwardHeaders = ['content-type', 'content-length', 'cache-control', 'expires', 'etag', 'last-modified'];
foreach (explode("\r\n", $responseHeaders) as $header) {
    $headerLower = strtolower($header);
    foreach ($forwardHeaders as $fh) {
        if (strpos($headerLower, $fh . ':') === 0) {
            header($header, false);
            break;
        }
    }
}

http_response_code($httpCode);
echo $responseBody;
