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

// ── Cache de respostas públicas GET ─────────────────────────────────────────
// Reduz a carga no backend (PHP-FPM compartilhado) e absorve rajadas de
// requisições: durante o TTL as respostas são servidas direto do cache e,
// se o backend falhar (503/502/erro de rede), serve a última cópia (stale)
// em vez de propagar o erro ao frontend.
$method = $_SERVER['REQUEST_METHOD'];
$cacheDir = __DIR__ . '/api-cache';
$cacheTtls = [
    '/articles/cafe-do-dia' => 60,
    '/recipes/cafe-do-dia' => 60,
    '/recipes/featured' => 60,
    '/integrations/weather' => 60,
    '/integrations/headlines' => 60,
    '/integrations/exchange' => 30,
    '/ai/status' => 60,
    '/test' => 30,
];
$cacheable = ($method === 'GET') && isset($cacheTtls['/' . $path]);
$cacheFile = $cacheable ? $cacheDir . '/' . sha1($path . '?' . $queryString) . '.json' : null;

function proxy_cache_serve($cacheFile, $cacheData, $hit) {
    header('Content-Type: ' . ($cacheData['content_type'] ?: 'application/json'));
    header('X-Proxy-Cache: ' . $hit);
    http_response_code(isset($cacheData['http_code']) ? (int)$cacheData['http_code'] : 200);
    echo $cacheData['body'];
    exit;
}

function proxy_try_stale_cache($cacheFile) {
    if ($cacheFile === null || !is_file($cacheFile)) {
        return false;
    }
    $cacheData = @json_decode(file_get_contents($cacheFile), true);
    if (!is_array($cacheData) || !isset($cacheData['body'])) {
        return false;
    }
    proxy_cache_serve($cacheFile, $cacheData, 'STALE');
    return true;
}

if ($cacheable && is_file($cacheFile)) {
    $cacheData = @json_decode(file_get_contents($cacheFile), true);
    if (is_array($cacheData) && isset($cacheData['body']) && (time() - ($cacheData['ts'] ?? 0)) <= $cacheTtls[$path]) {
        proxy_cache_serve($cacheFile, $cacheData, 'HIT');
    }
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

// IP real do backend via DNS direto (dns_get_record ignora /etc/hosts).
// Usado como FALLBACK quando o resolvedor thread-pool do cURL falha
// ("getaddrinfo() thread failed") em hospedagem compartilhada.
$host = parse_url(BACKEND_URL, PHP_URL_HOST);
$scheme = parse_url(BACKEND_URL, PHP_URL_SCHEME) ?: 'https';
$port = parse_url(BACKEND_URL, PHP_URL_PORT) ?: ($scheme === 'http' ? 80 : 443);
$resolve = null;
foreach (dns_get_record($host, DNS_A) as $rec) {
    if (filter_var($rec['ip'] ?? '', FILTER_VALIDATE_IP)) {
        $resolve = [$host.':'.$port.':'.$rec['ip']];
        break;
    }
}
if ($resolve === null) {
    $pinnedIp = gethostbyname($host);
    if (filter_var($pinnedIp, FILTER_VALIDATE_IP)) {
        $resolve = ["$host:$port:$pinnedIp"];
    }
}

// Executa a requisição com retry para falhas transitórias (rede/DNS e
// sobrecarga do backend). Só reintenta métodos idempotentes (GET/HEAD/OPTIONS)
// quando não há resposta HTTP (httpCode === 0) ou em 503/429 transitórios.
$method = $_SERVER['REQUEST_METHOD'];
$maxAttempts = 4;
$response = false;
$httpCode = 0;
$headerSize = 0;
$error = '';

for ($attempt = 0; $attempt < $maxAttempts; $attempt++) {
    // Tentativa 0 usa o resolvedor padrão; as seguintes fixam o IP no cURL
    // (contornando "getaddrinfo() thread failed") caso a 1ª falhe sem resposta.
    $useResolve = $resolve !== null && $attempt > 0;
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
        CURLOPT_ENCODING => '', // Accept & decode all encodings (gzip, deflate, br)
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_CUSTOMREQUEST => $method,
    ]);
    if ($useResolve) {
        curl_setopt($ch, CURLOPT_RESOLVE, $resolve);
    }

    // Set body for non-GET requests
    if ($method !== 'GET' && !empty($body)) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $error = curl_error($ch);
    curl_close($ch);

    $idempotent = in_array($method, ['GET', 'HEAD', 'OPTIONS'], true);
    $transient = $httpCode === 0 || $httpCode === 503 || $httpCode === 429;

    if ($response !== false && $httpCode > 0 && !($idempotent && $transient)) {
        break;
    }

    if ($attempt >= $maxAttempts - 1 || !$idempotent || !$transient) {
        break;
    }

    usleep(300000 * ($attempt + 1)); // 300ms, 600ms, 900ms
}

// Handle cURL errors (serve stale cache se houver)
if ($response === false || $httpCode === 0) {
    if (proxy_try_stale_cache($cacheFile)) {
        exit;
    }
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Proxy error', 'message' => $error ?: 'Sem resposta do backend']);
    exit;
}

// Backend respondeu 5xx após os retries — serve stale cache se houver
if ($httpCode >= 500) {
    if (proxy_try_stale_cache($cacheFile)) {
        exit;
    }
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

// Persiste resposta bem-sucedida no cache (GET público)
if ($cacheable && $httpCode >= 200 && $httpCode < 300) {
    if (!is_dir($cacheDir)) {
        @mkdir($cacheDir, 0755, true);
        @file_put_contents($cacheDir . '/.htaccess', "Require all denied\n");
    }
    $contentType = '';
    foreach (explode("\r\n", $responseHeaders) as $h) {
        if (stripos($h, 'content-type:') === 0) {
            $contentType = trim(substr($h, 13));
            break;
        }
    }
    @file_put_contents($cacheFile, json_encode([
        'ts' => time(),
        'http_code' => $httpCode,
        'content_type' => $contentType ?: 'application/json',
        'body' => $responseBody,
    ]));
}

// Set HTTP status code
http_response_code($httpCode);

// Output the response body
echo $responseBody;
