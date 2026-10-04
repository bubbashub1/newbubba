<?php
declare(strict_types=1);

/* Load the existing WordPress database connection. */
$candidates = [
    dirname(__DIR__, 2) . '/wp-config.php',
    dirname(__DIR__) . '/wp-config.php',
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/wp-config.php'
];

foreach ($candidates as $file) {
    if ($file && is_file($file)) {
        require_once $file;
        break;
    }
}

global $wpdb;

if (!isset($wpdb) || !is_object($wpdb)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success'=>false,'error'=>'WordPress database connection could not be loaded.']);
    exit;
}

function bh_table(string $name): string {
    $allowed = ['activities','leaders','venues','categories','tags','activity_categories','activity_tags','activity_venues','activity_schedules','activity_accessibility','activity_images','users','children','favourites','planner_items','bookings','payments','reviews','ads','app_profiles','app_notifications','app_planner','app_messages','app_pro'];
    if (!in_array($name, $allowed, true)) {
        throw new InvalidArgumentException('Invalid Bubba Hub table.');
    }
    return 'bh_' . $name;
}

function bh_json(mixed $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}
