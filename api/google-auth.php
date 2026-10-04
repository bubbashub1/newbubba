<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

$config = require __DIR__ . '/../config/google-oauth.php';
global $wpdb;

$wpdb->query("CREATE TABLE IF NOT EXISTS bh_users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(190) NOT NULL,
    password_hash VARCHAR(255) NULL,
    name VARCHAR(190) NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'family',
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    auth_provider VARCHAR(30) NOT NULL DEFAULT 'password',
    google_sub VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE KEY email(email),
    UNIQUE KEY google_sub(google_sub)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$columns = $wpdb->get_results("SHOW COLUMNS FROM bh_users");
$columnNames = array_map(static fn($row) => $row->Field, $columns ?: []);

if (!in_array('google_sub', $columnNames, true)) {
    $wpdb->query("ALTER TABLE bh_users ADD COLUMN google_sub VARCHAR(255) NULL UNIQUE AFTER email");
}
if (!in_array('auth_provider', $columnNames, true)) {
    $wpdb->query("ALTER TABLE bh_users ADD COLUMN auth_provider VARCHAR(30) NOT NULL DEFAULT 'password' AFTER status");
}
$wpdb->query("ALTER TABLE bh_users MODIFY password_hash VARCHAR(255) NULL");

if (!isset($_SESSION['bh_csrf'])) {
    $_SESSION['bh_csrf'] = bin2hex(random_bytes(24));
}

function google_redirect(string $query = ''): never {
    $script = (string)($_SERVER['SCRIPT_NAME'] ?? '/api/google-auth.php');
    $base = dirname(dirname($script));
    if ($base === '.' || $base === DIRECTORY_SEPARATOR) {
        $base = '';
    }
    $url = rtrim($base, '/') . '/account.html';
    header('Location: ' . $url . ($query !== '' ? '?' . $query : ''));
    exit;
}

function google_fail(string $message = 'Google Sign-In could not be completed.'): never {
    error_log('Bubba Hub Google OAuth: ' . $message);
    google_redirect('google_error=1');
}

function google_configured(array $config): bool {
    return !empty($config['client_id'])
        && !empty($config['client_secret'])
        && !empty($config['redirect_uri']);
}

function google_http(string $url, array $options = []): array {
    if (!function_exists('curl_init')) {
        return ['ok' => false, 'body' => '', 'status' => 0];
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
    ]);

    foreach ($options as $key => $value) {
        curl_setopt($ch, $key, $value);
    }

    $body = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'ok' => $body !== false && $status >= 200 && $status < 300,
        'body' => is_string($body) ? $body : '',
        'status' => $status,
    ];
}

$action = (string)($_GET['action'] ?? '');

if ($action === 'start') {
    if (!google_configured($config)) {
        http_response_code(503);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Google Sign-In is not fully configured on Bubba Hub.';
        exit;
    }

    $state = bin2hex(random_bytes(32));
    $_SESSION['google_oauth_state'] = $state;

    $params = [
        'client_id' => $config['client_id'],
        'redirect_uri' => $config['redirect_uri'],
        'response_type' => 'code',
        'scope' => implode(' ', $config['scopes']),
        'state' => $state,
        'access_type' => 'online',
        'prompt' => 'select_account',
    ];

    header('Location: https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params));
    exit;
}

if ($action !== 'callback') {
    bh_json([
        'success' => false,
        'configured' => google_configured($config),
        'message' => 'Google Sign-In endpoint ready.'
    ]);
}

if (!google_configured($config)) {
    google_fail('Google OAuth credentials are missing.');
}

if (!empty($_GET['error'])) {
    google_fail('Google returned an OAuth error.');
}

$state = (string)($_GET['state'] ?? '');
$expectedState = (string)($_SESSION['google_oauth_state'] ?? '');
unset($_SESSION['google_oauth_state']);

if ($state === '' || $expectedState === '' || !hash_equals($expectedState, $state)) {
    google_fail('Invalid OAuth state.');
}

$code = (string)($_GET['code'] ?? '');
if ($code === '') {
    google_fail('Missing OAuth authorization code.');
}

$token = google_http('https://oauth2.googleapis.com/token', [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query([
        'code' => $code,
        'client_id' => $config['client_id'],
        'client_secret' => $config['client_secret'],
        'redirect_uri' => $config['redirect_uri'],
        'grant_type' => 'authorization_code',
    ]),
    CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded', 'Accept: application/json'],
]);

if (!$token['ok']) {
    google_fail('Google token exchange failed.');
}

$tokenData = json_decode($token['body'], true);
$accessToken = is_array($tokenData) ? (string)($tokenData['access_token'] ?? '') : '';

if ($accessToken === '') {
    google_fail('Google did not return an access token.');
}

$userInfo = google_http('https://openidconnect.googleapis.com/v1/userinfo', [
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $accessToken,
        'Accept: application/json'
    ],
]);

if (!$userInfo['ok']) {
    google_fail('Google user information could not be retrieved.');
}

$googleUser = json_decode($userInfo['body'], true);
if (!is_array($googleUser)) {
    google_fail('Invalid Google user information.');
}

$googleSub = trim((string)($googleUser['sub'] ?? ''));
$email = strtolower(trim((string)($googleUser['email'] ?? '')));
$emailVerified = filter_var($googleUser['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);
$name = trim((string)($googleUser['name'] ?? ''));

if ($googleSub === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || !$emailVerified) {
    google_fail('Google did not provide a verified email address.');
}

$user = $wpdb->get_row(
    $wpdb->prepare("SELECT * FROM bh_users WHERE google_sub=%s LIMIT 1", $googleSub),
    ARRAY_A
);

if (!$user) {
    $user = $wpdb->get_row(
        $wpdb->prepare("SELECT * FROM bh_users WHERE email=%s LIMIT 1", $email),
        ARRAY_A
    );
}

if ($user) {
    $wpdb->update(
        'bh_users',
        [
            'google_sub' => $googleSub,
            'auth_provider' => (($user['auth_provider'] ?? 'password') === 'password') ? 'password_google' : ($user['auth_provider'] ?? 'google'),
            'name' => $user['name'] ?: ($name ?: null),
        ],
        ['id' => (int)$user['id']],
        ['%s', '%s', '%s'],
        ['%d']
    );
    $userId = (int)$user['id'];
    $role = (string)($user['role'] ?? 'family');
    $userStatus = (string)($user['status'] ?? 'active');
    if ($userStatus !== 'active') {
        google_fail('This Bubba Hub account is not active.');
    }
} else {
    $randomPassword = password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT);

    $ok = $wpdb->insert(
        'bh_users',
        [
            'email' => $email,
            'password_hash' => $randomPassword,
            'name' => $name ?: null,
            'role' => 'family',
            'status' => 'active',
            'auth_provider' => 'google',
            'google_sub' => $googleSub,
        ],
        ['%s', '%s', '%s', '%s', '%s', '%s', '%s']
    );

    if (!$ok) {
        google_fail('Could not create the Bubba Hub account.');
    }

    $userId = (int)$wpdb->insert_id;
    $role = 'family';
}

session_regenerate_id(true);
$_SESSION['bh_user_id'] = $userId;
$_SESSION['bh_csrf'] = bin2hex(random_bytes(24));

google_redirect('google=success');
