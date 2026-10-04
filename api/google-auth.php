<?php
/**
 * Bubba Hub Google Sign-In placeholder endpoint.
 *
 * This file intentionally does not authenticate anyone yet.
 * It will handle the Google OAuth callback once Google Cloud credentials
 * and the authorised redirect URI have been configured.
 */

header('Content-Type: application/json; charset=utf-8');

$config = require __DIR__ . '/../config/google-oauth.php';

if (!$config['client_id'] || !$config['client_secret'] || !$config['redirect_uri']) {
    http_response_code(503);
    echo json_encode([
        'success' => false,
        'configured' => false,
        'message' => 'Google Sign-In is not configured yet.',
    ]);
    exit;
}

echo json_encode([
    'success' => false,
    'configured' => true,
    'message' => 'Google Sign-In is ready for OAuth implementation.',
]);
