<?php
/**
 * Newsletter API - Artigo com Café
 * 
 * Recebe inscrições da newsletter e armazena localmente.
 * Envia notificação por email para o admin usando PHP mail().
 * 
 * POST /api-newsletter.php
 * Body: { "email": "user@example.com" }
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = trim($input['email'] ?? '');

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email inválido']);
    exit;
}

// Directory to store subscriptions
$dataDir = __DIR__ . '/storage/newsletter';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

$filePath = $dataDir . '/subscribers.json';

// Load existing subscribers
$subscribers = [];
if (file_exists($filePath)) {
    $content = file_get_contents($filePath);
    $subscribers = json_decode($content, true) ?? [];
}

// Check if already subscribed
foreach ($subscribers as $sub) {
    if ($sub['email'] === $email) {
        http_response_code(200);
        echo json_encode(['message' => 'Email já cadastrado!', 'status' => 'duplicate']);
        exit;
    }
}

// Add new subscriber
$subscribers[] = [
    'email' => $email,
    'subscribed_at' => date('Y-m-d H:i:s'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
];

// Save
file_put_contents($filePath, json_encode($subscribers, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);

// Try to send email notification to admin
$adminEmail = 'newsletter@artigocomcafe.com';
$subject = '📬 Nova inscrição na Newsletter - Artigo com Café';
$message = "Nova inscrição na newsletter!\n\n";
$message .= "Email: $email\n";
$message .= "Data: " . date('d/m/Y H:i:s') . "\n";
$message .= "Total inscritos: " . count($subscribers) . "\n";

$headers = "From: newsletter@artigocomcafe.com\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

@mail($adminEmail, $subject, $message, $headers);

// Return success
http_response_code(200);
echo json_encode([
    'message' => 'Inscrição realizada com sucesso!',
    'status' => 'success',
    'total_subscribers' => count($subscribers),
]);
