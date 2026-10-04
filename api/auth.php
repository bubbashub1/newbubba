<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';

if(session_status()!==PHP_SESSION_ACTIVE){
 session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off','httponly'=>true,'samesite'=>'Lax']);
 session_start();
}
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
 PRIMARY KEY(id), UNIQUE KEY email(email), UNIQUE KEY google_sub(google_sub)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$columns=$wpdb->get_results("SHOW COLUMNS FROM bh_users");
$columnNames=array_map(static fn($row)=>$row->Field,$columns?:[]);
if(!in_array('google_sub',$columnNames,true)) $wpdb->query("ALTER TABLE bh_users ADD COLUMN google_sub VARCHAR(255) NULL UNIQUE AFTER email");
if(!in_array('auth_provider',$columnNames,true)) $wpdb->query("ALTER TABLE bh_users ADD COLUMN auth_provider VARCHAR(30) NOT NULL DEFAULT 'password' AFTER status");
$wpdb->query("ALTER TABLE bh_users MODIFY password_hash VARCHAR(255) NULL");

if(!isset($_SESSION['bh_csrf'])) $_SESSION['bh_csrf']=bin2hex(random_bytes(24));
$method=$_SERVER['REQUEST_METHOD'];
$body=json_decode((string)file_get_contents('php://input'),true);
if(!is_array($body)) $body=[];

if($method==='GET'){
 $id=(int)($_SESSION['bh_user_id']??0);
 if($id<1) bh_json(['success'=>true,'authenticated'=>false,'csrf'=>$_SESSION['bh_csrf']]);
 $u=$wpdb->get_row($wpdb->prepare("SELECT id,email,name,role,status,auth_provider FROM bh_users WHERE id=%d",$id),ARRAY_A);
 if(!$u){unset($_SESSION['bh_user_id']);bh_json(['success'=>true,'authenticated'=>false,'csrf'=>$_SESSION['bh_csrf']]);}
 bh_json(['success'=>true,'authenticated'=>true,'user'=>$u,'csrf'=>$_SESSION['bh_csrf']]);
}

$action=(string)($body['action']??'');
if($action==='register'){
 $email=strtolower(trim((string)($body['email']??''))); $password=(string)($body['password']??''); $name=trim((string)($body['name']??''));
 if(!filter_var($email,FILTER_VALIDATE_EMAIL)) bh_json(['success'=>false,'error'=>'Please enter a valid email address.'],422);
 if(strlen($password)<8) bh_json(['success'=>false,'error'=>'Password must be at least 8 characters.'],422);
 if($wpdb->get_var($wpdb->prepare("SELECT id FROM bh_users WHERE email=%s",$email))) bh_json(['success'=>false,'error'=>'An account already exists for this email.'],409);
 $ok=$wpdb->insert('bh_users',['email'=>$email,'password_hash'=>password_hash($password,PASSWORD_DEFAULT),'name'=>$name?:null,'role'=>'family','status'=>'active','auth_provider'=>'password'],['%s','%s','%s','%s','%s','%s']);
 if(!$ok) bh_json(['success'=>false,'error'=>'Could not create your account.'],500);
 $_SESSION['bh_user_id']=(int)$wpdb->insert_id;
 bh_json(['success'=>true,'authenticated'=>true,'user'=>['id'=>$_SESSION['bh_user_id'],'email'=>$email,'name'=>$name,'role'=>'family'],'csrf'=>$_SESSION['bh_csrf']]);
}
if($action==='login'){
 $email=strtolower(trim((string)($body['email']??''))); $password=(string)($body['password']??'');
 $u=$wpdb->get_row($wpdb->prepare("SELECT * FROM bh_users WHERE email=%s LIMIT 1",$email),ARRAY_A);
 if(!$u || empty($u['password_hash']) || !password_verify($password,(string)$u['password_hash']) || ($u['status']??'active')!=='active') bh_json(['success'=>false,'error'=>'Email or password is incorrect.'],401);
 session_regenerate_id(true); $_SESSION['bh_user_id']=(int)$u['id']; $_SESSION['bh_csrf']=bin2hex(random_bytes(24));
 bh_json(['success'=>true,'authenticated'=>true,'user'=>['id'=>(int)$u['id'],'email'=>$u['email'],'name'=>$u['name']??'','role'=>$u['role']??'family'],'csrf'=>$_SESSION['bh_csrf']]);
}
if($action==='change_password'){
 $id=(int)($_SESSION['bh_user_id']??0); if($id<1) bh_json(['success'=>false,'error'=>'login_required'],401);
 if(!hash_equals((string)$_SESSION['bh_csrf'],(string)($body['csrf']??''))) bh_json(['success'=>false,'error'=>'Security check failed.'],403);
 $current=(string)($body['current_password']??''); $new=(string)($body['new_password']??'');
 $u=$wpdb->get_row($wpdb->prepare("SELECT password_hash,auth_provider FROM bh_users WHERE id=%d LIMIT 1",$id),ARRAY_A);
 $isGoogleOnly=($u && ($u['auth_provider']??'')==='google' && empty($u['password_hash']));
 if(!$isGoogleOnly && (!$u || empty($u['password_hash']) || !password_verify($current,(string)$u['password_hash']))) bh_json(['success'=>false,'error'=>'Current password is incorrect.'],422);
 if(strlen($new)<8) bh_json(['success'=>false,'error'=>'New password must be at least 8 characters.'],422);
 $wpdb->update('bh_users',['password_hash'=>password_hash($new,PASSWORD_DEFAULT),'auth_provider'=>$isGoogleOnly?'password_google':($u['auth_provider']??'password')],['id'=>$id],['%s','%s'],['%d']);
 bh_json(['success'=>true,'message'=>'Password updated.']);
}
if($action==='logout'){
 unset($_SESSION['bh_user_id']); $_SESSION['bh_csrf']=bin2hex(random_bytes(24)); bh_json(['success'=>true,'authenticated'=>false,'csrf'=>$_SESSION['bh_csrf']]);
}
bh_json(['success'=>false,'error'=>'Unknown action.'],400);
