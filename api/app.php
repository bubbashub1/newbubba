<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';
if(session_status()!==PHP_SESSION_ACTIVE) session_start();
global $wpdb;
$userId=(int)($_SESSION['bh_user_id']??0);
if(!isset($_SESSION['bh_csrf'])) $_SESSION['bh_csrf']=bin2hex(random_bytes(24));

$tables=[
"CREATE TABLE IF NOT EXISTS bh_app_profiles (user_id BIGINT UNSIGNED PRIMARY KEY, phone VARCHAR(60) NULL, postcode VARCHAR(20) NULL, region VARCHAR(100) NULL, town VARCHAR(100) NULL, email_updates TINYINT(1) NOT NULL DEFAULT 1, planner_reminders TINYINT(1) NOT NULL DEFAULT 1, saved_activity_updates TINYINT(1) NOT NULL DEFAULT 1, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)",
"CREATE TABLE IF NOT EXISTS bh_app_notifications (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,user_id BIGINT UNSIGNED NOT NULL,type VARCHAR(50) NOT NULL,title VARCHAR(190) NOT NULL,message TEXT NULL,read_at DATETIME NULL,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,KEY user_id(user_id))",
"CREATE TABLE IF NOT EXISTS bh_app_planner (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,user_id BIGINT UNSIGNED NOT NULL,activity_id BIGINT UNSIGNED NULL,title VARCHAR(190) NOT NULL,start_at DATETIME NULL,end_at DATETIME NULL,notes TEXT NULL,status VARCHAR(30) NOT NULL DEFAULT 'planned',created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,KEY user_id(user_id))",
"CREATE TABLE IF NOT EXISTS bh_app_messages (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,user_id BIGINT UNSIGNED NULL,name VARCHAR(190) NOT NULL,email VARCHAR(190) NOT NULL,subject VARCHAR(190) NOT NULL,message TEXT NOT NULL,status VARCHAR(30) NOT NULL DEFAULT 'new',created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)",
"CREATE TABLE IF NOT EXISTS bh_app_pro (user_id BIGINT UNSIGNED PRIMARY KEY,product VARCHAR(50) NOT NULL,active TINYINT(1) NOT NULL DEFAULT 0,started_at DATETIME NULL,expires_at DATETIME NULL)"
];
foreach($tables as $sql) $wpdb->query($sql);

$body=json_decode((string)file_get_contents('php://input'),true); if(!is_array($body)) $body=[];
$action=(string)($body['action']??$_GET['action']??'');
if($action==='contact'){
 $name=trim((string)($body['name']??''));$email=trim((string)($body['email']??''));$subject=trim((string)($body['subject']??''));$message=trim((string)($body['message']??''));
 if($name===''||!filter_var($email,FILTER_VALIDATE_EMAIL)||$subject===''||$message==='') bh_json(['success'=>false,'error'=>'Please complete all contact fields.'],422);
 $ok=$wpdb->insert('bh_app_messages',['user_id'=>$userId?:null,'name'=>$name,'email'=>$email,'subject'=>$subject,'message'=>$message],['%d','%s','%s','%s','%s']);
 if(!$ok) bh_json(['success'=>false,'error'=>'Could not send your message.'],500);
 bh_json(['success'=>true,'message'=>'Thanks — your message has been sent.']);
}
if($userId<1) bh_json(['success'=>false,'error'=>'login_required','message'=>'Please sign in to use this area.'],401);
if($action==='profile' && $_SERVER['REQUEST_METHOD']==='GET'){
 $p=$wpdb->get_row($wpdb->prepare("SELECT * FROM bh_app_profiles WHERE user_id=%d",$userId),ARRAY_A) ?: [];
 $u=$wpdb->get_row($wpdb->prepare("SELECT id,email,name,role FROM bh_users WHERE id=%d",$userId),ARRAY_A);
 bh_json(['success'=>true,'profile'=>$p,'user'=>$u,'csrf'=>$_SESSION['bh_csrf']]);
}
if($action==='profile' && $_SERVER['REQUEST_METHOD']==='POST'){
 if(!hash_equals((string)$_SESSION['bh_csrf'],(string)($body['csrf']??''))) bh_json(['success'=>false,'error'=>'Security check failed.'],403);
 $name=trim((string)($body['name']??''));$phone=trim((string)($body['phone']??''));$postcode=trim((string)($body['postcode']??''));$region=trim((string)($body['region']??''));$town=trim((string)($body['town']??''));
 $wpdb->query($wpdb->prepare("INSERT INTO bh_app_profiles(user_id,phone,postcode,region,town) VALUES(%d,%s,%s,%s,%s) ON DUPLICATE KEY UPDATE phone=VALUES(phone),postcode=VALUES(postcode),region=VALUES(region),town=VALUES(town)",$userId,$phone,$postcode,$region,$town));
 if($name!=='') $wpdb->update('bh_users',['name'=>$name],['id'=>$userId],['%s'],['%d']);
 bh_json(['success'=>true]);
}
if($action==='notification_preferences' && $_SERVER['REQUEST_METHOD']==='POST'){
 if(!hash_equals((string)$_SESSION['bh_csrf'],(string)($body['csrf']??''))) bh_json(['success'=>false,'error'=>'Security check failed.'],403);
 $fields=['email_updates','planner_reminders','saved_activity_updates']; $set=[]; $vals=[];
 foreach($fields as $f){$set[]=$f.'=%d';$vals[]=!empty($body[$f])?1:0;} $vals[]=$userId;
 $wpdb->query($wpdb->prepare('UPDATE bh_app_profiles SET '.implode(',',$set).' WHERE user_id=%d',...$vals));
 if($wpdb->rows_affected===0) $wpdb->query($wpdb->prepare('INSERT INTO bh_app_profiles(user_id,email_updates,planner_reminders,saved_activity_updates) VALUES(%d,%d,%d,%d)',$userId,$vals[0],$vals[1],$vals[2]));
 bh_json(['success'=>true]);
}
if($action==='notification_preferences' && $_SERVER['REQUEST_METHOD']==='GET'){
 $p=$wpdb->get_row($wpdb->prepare('SELECT email_updates,planner_reminders,saved_activity_updates FROM bh_app_profiles WHERE user_id=%d',$userId),ARRAY_A) ?: ['email_updates'=>1,'planner_reminders'=>1,'saved_activity_updates'=>1];
 bh_json(['success'=>true,'preferences'=>$p,'csrf'=>$_SESSION['bh_csrf']]);
}
if($action==='notification_preferences' && $_SERVER['REQUEST_METHOD']==='GET'){ $p=$wpdb->get_row($wpdb->prepare('SELECT email_updates,planner_reminders,saved_activity_updates FROM bh_app_profiles WHERE user_id=%d',$userId),ARRAY_A) ?: ['email_updates'=>1,'planner_reminders'=>1,'saved_activity_updates'=>1]; bh_json(['success'=>true,'preferences'=>$p,'csrf'=>$_SESSION['bh_csrf']]); }
if($action==='notification_preferences' && $_SERVER['REQUEST_METHOD']==='POST'){ if(!hash_equals((string)$_SESSION['bh_csrf'],(string)($body['csrf']??''))) bh_json(['success'=>false,'error'=>'Security check failed.'],403); $wpdb->query($wpdb->prepare('INSERT INTO bh_app_profiles(user_id,email_updates,planner_reminders,saved_activity_updates) VALUES(%d,%d,%d,%d) ON DUPLICATE KEY UPDATE email_updates=VALUES(email_updates),planner_reminders=VALUES(planner_reminders),saved_activity_updates=VALUES(saved_activity_updates)',$userId,!empty($body['email_updates'])?1:0,!empty($body['planner_reminders'])?1:0,!empty($body['saved_activity_updates'])?1:0)); bh_json(['success'=>true]); }
if($action==='planner'){
 if($_SERVER['REQUEST_METHOD']==='GET'){
  $rows=$wpdb->get_results($wpdb->prepare("SELECT * FROM bh_app_planner WHERE user_id=%d ORDER BY start_at IS NULL,start_at,id DESC",$userId),ARRAY_A);
  bh_json(['success'=>true,'items'=>$rows,'csrf'=>$_SESSION['bh_csrf']]);
 }
 if(!hash_equals((string)$_SESSION['bh_csrf'],(string)($body['csrf']??''))) bh_json(['success'=>false,'error'=>'Security check failed.'],403);
 $op=(string)($body['op']??'save');
 if($op==='delete'){ $wpdb->delete('bh_app_planner',['id'=>(int)$body['id'],'user_id'=>$userId],['%d','%d']); bh_json(['success'=>true]); }
 $data=['user_id'=>$userId,'activity_id'=>($body['activity_id']??null)?(int)$body['activity_id']:null,'title'=>trim((string)($body['title']??'')),'start_at'=>($body['start_at']??'')?:null,'end_at'=>($body['end_at']??'')?:null,'notes'=>trim((string)($body['notes']??'')),'status'=>'planned'];
 if($data['title']==='') bh_json(['success'=>false,'error'=>'A plan title is required.'],422);
 $id=(int)($body['id']??0);
 if($id){$wpdb->update('bh_app_planner',$data,['id'=>$id,'user_id'=>$userId]);}else{$wpdb->insert('bh_app_planner',$data,['%d','%d','%s','%s','%s','%s','%s']);$id=(int)$wpdb->insert_id;}
 bh_json(['success'=>true,'id'=>$id]);
}
if($action==='notifications'){
 $rows=$wpdb->get_results($wpdb->prepare("SELECT * FROM bh_app_notifications WHERE user_id=%d ORDER BY created_at DESC LIMIT 100",$userId),ARRAY_A);
 bh_json(['success'=>true,'items'=>$rows,'csrf'=>$_SESSION['bh_csrf']]);
}
if($action==='pro'){
 $product=preg_match('/^(leader|planner)$/',(string)($body['product']??''))?(string)$body['product']:'planner';
 $row=$wpdb->get_row($wpdb->prepare("SELECT * FROM bh_app_pro WHERE user_id=%d AND product=%s",$userId,$product),ARRAY_A);
 bh_json(['success'=>true,'product'=>$product,'pro'=>$row?:['active'=>0],'csrf'=>$_SESSION['bh_csrf']]);
}
bh_json(['success'=>false,'error'=>'Unknown action.'],400);