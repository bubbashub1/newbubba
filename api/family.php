<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off','httponly'=>true,'samesite'=>'Lax']);
    session_start();
}

global $wpdb;
$userId=(int)($_SESSION['bh_user_id'] ?? 0);
if($userId<1) bh_json(['success'=>false,'error'=>'login_required','message'=>'Please sign in to manage your family.'],401);

if(!isset($_SESSION['bh_csrf'])) $_SESSION['bh_csrf']=bin2hex(random_bytes(24));

if($_SERVER['REQUEST_METHOD']==='GET'){
  $children=$wpdb->get_results($wpdb->prepare("SELECT id,name,gender,date_of_birth FROM ".bh_table('children')." WHERE user_id=%d ORDER BY date_of_birth IS NULL,date_of_birth,name",$userId),ARRAY_A);
  if($wpdb->last_error) bh_json(['success'=>false,'error'=>'Could not load family.'],500);
  bh_json(['success'=>true,'children'=>$children,'csrf'=>$_SESSION['bh_csrf']]);
}
if($_SERVER['REQUEST_METHOD']!=='POST') bh_json(['success'=>false,'error'=>'POST required.'],405);

$body=json_decode((string)file_get_contents('php://input'),true);
if(!is_array($body)) bh_json(['success'=>false,'error'=>'Invalid request.'],400);
$csrf=(string)($body['csrf']??'');
if($csrf===''||!hash_equals((string)$_SESSION['bh_csrf'],$csrf)) bh_json(['success'=>false,'error'=>'Security check failed.'],403);

$action=(string)($body['action']??'');
if($action==='save_child'){
  $id=(int)($body['id']??0);
  $name=trim((string)($body['name']??''));
  $gender=trim((string)($body['gender']??''));
  $dob=trim((string)($body['date_of_birth']??''));
  if($name==='') bh_json(['success'=>false,'error'=>'Please enter the child’s name.'],422);
  $dobValue=null;
  if($dob!==''){
    $d=DateTime::createFromFormat('Y-m-d',$dob);
    if(!$d||$d->format('Y-m-d')!==$dob) bh_json(['success'=>false,'error'=>'Please enter a valid date of birth.'],422);
    $dobValue=$dob;
  }
  if($id>0){
    $ok=$wpdb->update(bh_table('children'),['name'=>$name,'gender'=>$gender?:null,'date_of_birth'=>$dobValue],['id'=>$id,'user_id'=>$userId],['%s','%s','%s'],['%d','%d']);
    if($ok===false) bh_json(['success'=>false,'error'=>'Could not update child.'],500);
  } else {
    $ok=$wpdb->insert(bh_table('children'),['user_id'=>$userId,'name'=>$name,'gender'=>$gender?:null,'date_of_birth'=>$dobValue],['%d','%s','%s','%s']);
    if(!$ok) bh_json(['success'=>false,'error'=>'Could not add child.'],500);
    $id=(int)$wpdb->insert_id;
  }
  bh_json(['success'=>true,'id'=>$id]);
}
if($action==='delete_child'){
  $id=(int)($body['id']??0);
  if($id<1) bh_json(['success'=>false,'error'=>'Child not found.'],422);
  $wpdb->delete(bh_table('children'),['id'=>$id,'user_id'=>$userId],['%d','%d']);
  bh_json(['success'=>true]);
}
bh_json(['success'=>false,'error'=>'Unknown action.'],400);