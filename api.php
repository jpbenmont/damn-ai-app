<?php
// DAMN AI — Secure Server-Side Gemini API Proxy
// Loads GEMINI_API_KEY strictly from server environment or local .env (never hardcoded).
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$GEMINI_API_KEY = getenv('GEMINI_API_KEY') ?: '';

if (empty($GEMINI_API_KEY) && file_exists(__DIR__ . '/.env')) {
    $envLines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($envLines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0) {
            continue;
        }
        if (strpos($line, 'GEMINI_API_KEY=') === 0) {
            $GEMINI_API_KEY = trim(substr($line, strlen('GEMINI_API_KEY=')), " \t\n\r\0\x0B\"'");
            break;
        }
    }
}

if (empty($GEMINI_API_KEY)) {
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration error: GEMINI_API_KEY is not configured in .env']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || empty($input['prompt'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid prompt input']);
    exit;
}

$prompt = $input['prompt'];
$systemContext = $input['systemContext'] ?? '';

$models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
$successResponse = null;

foreach ($models as $model) {
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . urlencode($GEMINI_API_KEY);

    $payload = [
        "contents" => [
            ["parts" => [["text" => $prompt]]]
        ]
    ];
    if (!empty($systemContext)) {
        $payload["systemInstruction"] = [
            "parts" => [["text" => $systemContext]]
        ];
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'x-goog-api-key: ' . $GEMINI_API_KEY
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && $response) {
        $data = json_decode($response, true);
        if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            $successResponse = $data['candidates'][0]['content']['parts'][0]['text'];
            break;
        }
    }
}

if ($successResponse !== null) {
    echo json_encode(['text' => $successResponse]);
} else {
    http_response_code(502);
    echo json_encode(['error' => 'Upstream AI API request failed']);
}
