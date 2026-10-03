<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';
global $wpdb;
$town=trim((string)($_GET['town']??''));
$region=trim((string)($_GET['region']??''));
$sql="SELECT id,leader_id,name,address_line_1,address_line_2,town,region,postcode,latitude,longitude FROM ".bh_table('venues')." WHERE status='published'";
$params=[];
if($town!==''){ $sql.=" AND town=%s"; $params[]=$town; }
if($region!==''){ $sql.=" AND region=%s"; $params[]=$region; }
$sql.=" ORDER BY town ASC,name ASC";
$query=$params?$wpdb->prepare($sql,...$params):$sql;
$rows=$wpdb->get_results($query,ARRAY_A);
if($wpdb->last_error) bh_json(['success'=>false,'error'=>'Database query failed.'],500);
bh_json(['success'=>true,'count'=>count($rows),'venues'=>$rows]);
