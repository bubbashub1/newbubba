<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';
if(session_status()!==PHP_SESSION_ACTIVE) session_start();
global $wpdb;
$userId=(int)($_SESSION['bh_user_id']??0);
if($userId<1) bh_json(['success'=>false,'error'=>'login_required','message'=>'Please sign in to use Saved Activities.'],401);
if(!isset($_SESSION['bh_csrf'])) $_SESSION['bh_csrf']=bin2hex(random_bytes(24));
if($_SERVER['REQUEST_METHOD']==='GET'){
 $sql="SELECT f.id,f.activity_id,a.title,a.slug,a.description,a.price,a.price_type,v.name AS venue_name,v.town FROM ".bh_table('favourites')." f INNER JOIN ".bh_table('activities')." a ON a.id=f.activity_id LEFT JOIN ".bh_table('activity_venues')." av ON av.activity_id=a.id AND av.is_primary=1 LEFT JOIN ".bh_table('venues')." v ON v.id=av.venue_id WHERE f.user_id=%d AND a.status='published' ORDER BY f.id DESC";
 $rows=$wpdb->get_results($wpdb->prepare($sql,$userId),ARRAY_A);
 if($wpdb->last_error) bh_json(['success'=>false,'error'=>'Could not load saved activities.'],500);
 bh_json(['success'=>true,'activities'=>$rows,'csrf'=>$_SESSION['bh_csrf']]);
}
if($_SERVER['REQUEST_METHOD']!=='POST') bh_json(['success'=>false,'error'=>'POST required.'],405);
$body=json_decode((string)file_get_contents('php://input'),true);
if(!is_array($body)) bh_json(['success'=>false,'error'=>'Invalid request.'],400);
$csrf=(string)($body['csrf']??'');
if($csrf===''||!hash_equals((string)$_SESSION['bh_csrf'],$csrf)) bh_json(['success'=>false,'error'=>'Security check failed.'],403);
$activityId=(int)($body['activity_id']??0); $saved=!empty($body['saved']);
if($activityId<1) bh_json(['success'=>false,'error'=>'Activity required.'],422);
if($saved){
 $exists=$wpdb->get_var($wpdb->prepare("SELECT id FROM ".bh_table('activities')." WHERE id=%d AND status='published'",$activityId));
 if(!$exists) bh_json(['success'=>false,'error'=>'Activity not found.'],404);
 $wpdb->query($wpdb->prepare("INSERT IGNORE INTO ".bh_table('favourites')." (user_id,activity_id) VALUES (%d,%d)",$userId,$activityId));
}else{
 $wpdb->delete(bh_table('favourites'),['user_id'=>$userId,'activity_id'=>$activityId],['%d','%d']);
}
if($wpdb->last_error) bh_json(['success'=>false,'error'=>'Could not update saved activity.'],500);
bh_json(['success'=>true,'saved'=>$saved]);
