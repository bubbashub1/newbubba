<?php
declare(strict_types=1);

/* Load the existing WordPress database connection. */
$candidates = [
    dirname(__DIR__, 2) . '/wp-config.php',
    dirname(__DIR__) . '/wp-config.php',
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/wp-config.php'
];

$loaded = false;
foreach ($candidates as $file) {
    if ($file && is_file($file)) {
        require_once $file;
        $loaded = true;
        break;
    }
}

global $wpdb;

if (!$loaded || !isset($wpdb) || !is_object($wpdb)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(['success'=>false,'error'=>'Database connection could not be loaded.']);
    exit;
}

function bh_table(string $name): string {
    $allowed = ['activities','leaders','venues','categories','tags','activity_categories','activity_tags','activity_venues','activity_schedules','activity_accessibility','activity_images','users','children','favourites','planner_items','bookings','payments','reviews','ads','app_profiles','app_notifications','app_planner','app_messages','app_pro'];
    if (!in_array($name, $allowed, true)) {
        throw new InvalidArgumentException('Invalid Bubba Hub table.');
    }
    return 'bh_' . $name;
}

function bh_start_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    if (!headers_sent()) {
        session_set_cookie_params([
            'lifetime'=>0,
            'path'=>'/',
            'secure'=>!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off',
            'httponly'=>true,
            'samesite'=>'Lax'
        ]);
        session_start();
    }
}

function bh_is_admin(): bool {
    bh_start_session();
    $id=(int)($_SESSION['bh_admin_user_id']??0);
    if($id<1)return false;
    global $wpdb;
    $role=$wpdb->get_var($wpdb->prepare("SELECT role FROM bh_users WHERE id=%d AND status='active' LIMIT 1",$id));
    return $role==='admin';
}

function bh_require_admin(): void {
    if(!bh_is_admin())bh_json(['success'=>false,'error'=>'admin_required'],403);
}

function bh_json($data,int $status=200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
    exit;
}
