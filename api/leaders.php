<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';
if(session_status()!==PHP_SESSION_ACTIVE) session_start();
global $wpdb;

$wpdb->query("CREATE TABLE IF NOT EXISTS bh_leader_users (user_id BIGINT UNSIGNED NOT NULL,leader_id BIGINT UNSIGNED NOT NULL,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id),UNIQUE KEY leader_user(leader_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
$action=(string)($_GET['action']??'');
$userId=(int)($_SESSION['bh_user_id']??0);
$csrf=function(): string { if(!isset($_SESSION['bh_csrf'])) $_SESSION['bh_csrf']=bin2hex(random_bytes(24)); return (string)$_SESSION['bh_csrf']; };

if($action==='profile'){
 if($userId<1) bh_json(['success'=>false,'error'=>'login_required'],401);
 $leader=$wpdb->get_row($wpdb->prepare("SELECT l.id,l.business_name FROM bh_leader_users lu INNER JOIN bh_leaders l ON l.id=lu.leader_id WHERE lu.user_id=%d LIMIT 1",$userId),ARRAY_A);
 if(!$leader) bh_json(['success'=>false,'error'=>'No linked class leader account.'],403);
 if($_SERVER['REQUEST_METHOD']==='POST'){
  $body=json_decode((string)file_get_contents('php://input'),true); if(!is_array($body)) $body=[];
  if(!hash_equals($csrf(),(string)($body['csrf']??''))) bh_json(['success'=>false,'error'=>'Security check failed.'],403);
  $name=trim((string)($body['business_name']??''));
  if($name==='') bh_json(['success'=>false,'error'=>'Business name is required.'],422);
  if(mb_strlen($name)>190) bh_json(['success'=>false,'error'=>'Business name is too long.'],422);
  if($wpdb->update('bh_leaders',['business_name'=>$name],['id'=>(int)$leader['id']],['%s'],['%d'])===false) bh_json(['success'=>false,'error'=>'Could not update leader profile.'],500);
  $leader['business_name']=$name;
 }
 bh_json(['success'=>true,'leader'=>$leader,'csrf'=>$csrf()]);
}


if($action==='mine'){
 if($userId<1) bh_json(['success'=>false,'error'=>'login_required'],401);
 $row=$wpdb->get_row($wpdb->prepare("SELECT l.id,l.business_name FROM bh_leader_users lu INNER JOIN bh_leaders l ON l.id=lu.leader_id WHERE lu.user_id=%d LIMIT 1",$userId),ARRAY_A);
 bh_json(['success'=>true,'leader'=>$row?:null]);
}

if($_SERVER['REQUEST_METHOD']==='POST' && $action==='link'){
 if($userId<1) bh_json(['success'=>false,'error'=>'login_required'],401);
 $body=json_decode((string)file_get_contents('php://input'),true); if(!is_array($body)) $body=[];
 if(!isset($_SESSION['bh_csrf'])) $_SESSION['bh_csrf']=bin2hex(random_bytes(24));
 if(!hash_equals((string)$_SESSION['bh_csrf'],(string)($body['csrf']??''))) bh_json(['success'=>false,'error'=>'Security check failed.'],403);
 $role=$wpdb->get_var($wpdb->prepare("SELECT role FROM bh_users WHERE id=%d",$userId));
 if($role!=='admin') bh_json(['success'=>false,'error'=>'Admin access required.'],403);
 $targetUser=(int)($body['user_id']??0); $leaderId=(int)($body['leader_id']??0);
 if($targetUser<1||$leaderId<1) bh_json(['success'=>false,'error'=>'User and leader are required.'],422);
 if(!$wpdb->get_var($wpdb->prepare("SELECT id FROM bh_users WHERE id=%d AND status='active'",$targetUser))) bh_json(['success'=>false,'error'=>'User not found.'],404);
 if(!$wpdb->get_var($wpdb->prepare("SELECT id FROM bh_leaders WHERE id=%d",$leaderId))) bh_json(['success'=>false,'error'=>'Leader not found.'],404);
 $wpdb->delete('bh_leader_users',['user_id'=>$targetUser],['%d']); $wpdb->delete('bh_leader_users',['leader_id'=>$leaderId],['%d']);
 if(!$wpdb->insert('bh_leader_users',['user_id'=>$targetUser,'leader_id'=>$leaderId],['%d','%d'])) bh_json(['success'=>false,'error'=>'Could not link leader account.'],500);
 bh_json(['success'=>true,'message'=>'Leader account linked.']);
}

$rows=$wpdb->get_results("SELECT id,business_name FROM bh_leaders ORDER BY business_name ASC",ARRAY_A);
if($wpdb->last_error) bh_json(['success'=>false,'error'=>'Database query failed.'],500);
bh_json(['success'=>true,'leaders'=>$rows]);