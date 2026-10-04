<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';
if(session_status()!==PHP_SESSION_ACTIVE){session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off','httponly'=>true,'samesite'=>'Lax']);session_start();}
global $wpdb;
$wpdb->query("CREATE TABLE IF NOT EXISTS bh_users (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,email VARCHAR(190) NOT NULL,password_hash VARCHAR(255) NOT NULL,name VARCHAR(190) NULL,role VARCHAR(30) NOT NULL DEFAULT 'family',status VARCHAR(30) NOT NULL DEFAULT 'active',created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,PRIMARY KEY(id),UNIQUE KEY email(email)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
if(!isset($_SESSION['bh_admin_csrf'])) $_SESSION['bh_admin_csrf']=bin2hex(random_bytes(24));
$body=json_decode((string)file_get_contents('php://input'),true);if(!is_array($body))$body=[];
if($_SERVER['REQUEST_METHOD']==='GET'){
 $id=(int)($_SESSION['bh_admin_user_id']??0);$count=(int)$wpdb->get_var("SELECT COUNT(*) FROM bh_users WHERE role='admin' AND status='active'");
 if($id<1)bh_json(['success'=>true,'authenticated'=>false,'setup_available'=>$count===0,'csrf'=>$_SESSION['bh_admin_csrf']]);
 $u=$wpdb->get_row($wpdb->prepare("SELECT id,email,name,role,status FROM bh_users WHERE id=%d AND role='admin' AND status='active'",$id),ARRAY_A);
 if(!$u){unset($_SESSION['bh_admin_user_id']);bh_json(['success'=>true,'authenticated'=>false,'setup_available'=>$count===0,'csrf'=>$_SESSION['bh_admin_csrf']]);}
 bh_json(['success'=>true,'authenticated'=>true,'user'=>$u,'setup_available'=>false,'csrf'=>$_SESSION['bh_admin_csrf']]);
}
$action=(string)($body['action']??'');
if($action==='setup'){
 if((int)$wpdb->get_var("SELECT COUNT(*) FROM bh_users WHERE role='admin'")>0)bh_json(['success'=>false,'error'=>'Admin setup has already been completed.'],409);
 $email=strtolower(trim((string)($body['email']??'')));$password=(string)($body['password']??'');$name=trim((string)($body['name']??''))?:'Bubba Hub Admin';
 if(!filter_var($email,FILTER_VALIDATE_EMAIL))bh_json(['success'=>false,'error'=>'Please enter a valid admin email address.'],422);
 if(strlen($password)<12)bh_json(['success'=>false,'error'=>'Admin password must be at least 12 characters.'],422);
 if($wpdb->get_var($wpdb->prepare("SELECT id FROM bh_users WHERE email=%s",$email)))bh_json(['success'=>false,'error'=>'That email is already in use by a Bubba Hub account. Choose another email.'],409);
 if(!$wpdb->insert('bh_users',['email'=>$email,'password_hash'=>password_hash($password,PASSWORD_DEFAULT),'name'=>$name,'role'=>'admin','status'=>'active'],['%s','%s','%s','%s','%s']))bh_json(['success'=>false,'error'=>'Could not create the admin account.'],500);
 session_regenerate_id(true);$_SESSION['bh_admin_user_id']=(int)$wpdb->insert_id;$_SESSION['bh_admin_csrf']=bin2hex(random_bytes(24));
 bh_json(['success'=>true,'authenticated'=>true,'message'=>'Admin account created. You are now signed in.','csrf'=>$_SESSION['bh_admin_csrf']]);
}
if($action==='login'){
 $email=strtolower(trim((string)($body['email']??'')));$password=(string)($body['password']??'');
 $u=$wpdb->get_row($wpdb->prepare("SELECT * FROM bh_users WHERE email=%s AND role='admin' AND status='active' LIMIT 1",$email),ARRAY_A);
 if(!$u||!password_verify($password,(string)$u['password_hash']))bh_json(['success'=>false,'error'=>'Admin email or password is incorrect.'],401);
 session_regenerate_id(true);$_SESSION['bh_admin_user_id']=(int)$u['id'];$_SESSION['bh_admin_csrf']=bin2hex(random_bytes(24));
 bh_json(['success'=>true,'authenticated'=>true,'user'=>['id'=>(int)$u['id'],'email'=>$u['email'],'name'=>$u['name']??'','role'=>'admin'],'csrf'=>$_SESSION['bh_admin_csrf']]);
}
if($action==='logout'){unset($_SESSION['bh_admin_user_id']);$_SESSION['bh_admin_csrf']=bin2hex(random_bytes(24));bh_json(['success'=>true,'authenticated'=>false,'csrf'=>$_SESSION['bh_admin_csrf']]);}
bh_json(['success'=>false,'error'=>'Unknown admin action.'],400);