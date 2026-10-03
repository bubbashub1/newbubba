<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';
global $wpdb;

$rows=$wpdb->get_results(
    "SELECT id,business_name FROM ".bh_table('leaders')." ORDER BY business_name ASC",
    ARRAY_A
);

if($wpdb->last_error) bh_json(['success'=>false,'error'=>'Database query failed.'],500);
bh_json(['success'=>true,'leaders'=>$rows]);
