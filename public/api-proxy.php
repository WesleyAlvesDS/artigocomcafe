<?php
/**
 * API Proxy - Artigo com Café
 * 
 * Este proxy encaminha requisições da API do frontend (artigocomcafe.com)
 * para o backend (back.artigocomcafe.com), contornando o problema de
 * certificado SSL que não cobre o subdomínio.
 * 
 * Uso: https://artigocomcafe.com/api-proxy.php/artigos/cafe-do-dia
 */

// Configuração
define('BACKEND_URL', 'https://back.artigocomcafe.com/api');

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With');
header('Access-Control-Max-Age: 86400');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Get the request path from the URL (without query string)
$requestUri = $_SERVER['REQUEST_URI'];
$scriptName = basename(__FILE__);
$queryString = $_SERVER['QUERY_STRING'] ?? '';

// Remove query string from path extraction
$requestPath = $queryString ? str_replace('?' . $queryString, '', $requestUri) : $requestUri;

// Extract path after api-proxy.php/
$path = '';
if (preg_match('#/' . preg_quote($scriptName, '#') . '/(.*)#', $requestPath, $matches)) {
    $path = $matches[1];
} elseif (preg_match('#/api-proxy/(.*)#', $requestPath, $matches)) {
    $path = $matches[1];
}

if (empty($path)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'No API path specified. Use: /api-proxy.php/{path}']);
    exit;
}

// Build the backend URL with query string
$backendUrl = BACKEND_URL . '/' . $path;
if (!empty($queryString)) {
    $backendUrl .= '?' . $queryString;
}

// Get the request body
$body = file_get_contents('php://input');

// Build headers to forward
$headers = [
    'Host: back.artigocomcafe.com',
];
foreach (getallheaders() as $name => $value) {
    $nameLower = strtolower($name);
    // Skip headers that could cause issues with backend
    if (in_array($nameLower, ['host', 'connection', 'content-length', 'origin', 'referer', 'x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-host'])) {
        continue;
    }
    $headers[] = "$name: $value";
}

// Initialize cURL
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
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_CUSTOMREQUEST => $_SERVER['REQUEST_METHOD'],
]);

// Set body for non-GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET' && !empty($body)) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

// Execute the request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$error = curl_error($ch);
curl_close($ch);

// Handle cURL errors
if ($error) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Proxy error', 'message' => $error]);
    exit;
}

// Extract response headers and body
$responseHeaders = substr($response, 0, $headerSize);
$responseBody = substr($response, $headerSize);

// Forward response headers (skip hop-by-hop)
$forwardHeaders = ['set-cookie', 'content-type', 'cache-control', 'location', 'content-disposition', 'www-authenticate', 'x-ratelimit-remaining', 'x-ratelimit-limit'];
foreach (explode("\r\n", $responseHeaders) as $header) {
    $headerLower = strtolower($header);
    foreach ($forwardHeaders as $fh) {
        if (strpos($headerLower, $fh . ':') === 0) {
            header($header, false);
            break;
        }
    }
}

// Set HTTP status code
http_response_code($httpCode);

// Output the response body
echo $responseBody;
