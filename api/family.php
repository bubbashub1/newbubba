<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';

bh_start_session();
global $wpdb;

$userId=(int)($_SESSION['bh_user_id'] ?? 0);
if($userId<1) bh_json(['success'=>false,'error'=>'login_required','message'=>'Please sign in to manage your family.'],401);
if(!isset($_SESSION['bh_csrf'])) $_SESSION['bh_csrf']=bin2hex(random_bytes(24));

$table=bh_table('children');

/* Keep the existing bh_children table as the single profile store.
 * These fields are added only when the existing table does not already have them.
 */
$columns=$wpdb->get_results("SHOW COLUMNS FROM {$table}",ARRAY_A) ?: [];
$names=[];
$types=[];
foreach($columns as $column){$names[]=$column['Field'];$types[$column['Field']]=strtolower((string)$column['Type']);}
if(!in_array('profile_type',$names,true)) $wpdb->query("ALTER TABLE {$table} ADD COLUMN profile_type VARCHAR(20) NOT NULL DEFAULT 'child'");
if(!in_array('nickname',$names,true)) $wpdb->query("ALTER TABLE {$table} ADD COLUMN nickname VARCHAR(190) NULL");
if(!in_array('due_date',$names,true)) $wpdb->query("ALTER TABLE {$table} ADD COLUMN due_date DATE NULL");
if(!in_array('baby_here',$names,true)) $wpdb->query("ALTER TABLE {$table} ADD COLUMN baby_here TINYINT(1) NOT NULL DEFAULT 0");
if(!in_array('photo',$names,true)) $wpdb->query("ALTER TABLE {$table} ADD COLUMN photo LONGTEXT NULL");
elseif(!str_contains($types['photo'] ?? '','text') && !str_contains($types['photo'] ?? '','blob')) $wpdb->query("ALTER TABLE {$table} MODIFY COLUMN photo LONGTEXT NULL");

if($wpdb->last_error) bh_json(['success'=>false,'error'=>'Could not prepare the family profile table.'],500);

if($_SERVER['REQUEST_METHOD']==='GET'){
  $children=$wpdb->get_results($wpdb->prepare(
    "SELECT id,name,gender,date_of_birth,photo FROM {$table} WHERE user_id=%d AND profile_type='child' ORDER BY date_of_birth IS NULL,date_of_birth,name",
    $userId
  ),ARRAY_A);
  $bump=$wpdb->get_row($wpdb->prepare(
    "SELECT id,nickname,due_date,baby_here,photo FROM {$table} WHERE user_id=%d AND profile_type='bump' ORDER BY id DESC LIMIT 1",
    $userId
  ),ARRAY_A);
  if($wpdb->last_error) bh_json(['success'=>false,'error'=>'Could not load family profiles.'],500);
  bh_json(['success'=>true,'children'=>$children,'bump'=>$bump?:null,'csrf'=>$_SESSION['bh_csrf']]);
}

if($_SERVER['REQUEST_METHOD']!=='POST') bh_json(['success'=>false,'error'=>'POST required.'],405);
$body=json_decode((string)file_get_contents('php://input'),true);
if(!is_array($body)) bh_json(['success'=>false,'error'=>'Invalid request.'],400);
if(!hash_equals((string)$_SESSION['bh_csrf'],(string)($body['csrf']??''))) bh_json(['success'=>false,'error'=>'Security check failed.'],403);

$action=(string)($body['action']??'');

if($action==='save_child'){
  $id=(int)($body['id']??0);
  $name=trim((string)($body['name']??''));
  $gender=trim((string)($body['gender']??''));
  $dob=trim((string)($body['date_of_birth']??''));
  $photo=(string)($body['photo']??'');
  if($name==='') bh_json(['success'=>false,'error'=>'Please enter the child’s name.'],422);
  if(strlen($photo)>3500000) bh_json(['success'=>false,'error'=>'Please choose a smaller photo.'],422);
  $dobValue=null;
  if($dob!==''){
    $d=DateTime::createFromFormat('Y-m-d',$dob);
    if(!$d||$d->format('Y-m-d')!==$dob) bh_json(['success'=>false,'error'=>'Please enter a valid date of birth.'],422);
    $dobValue=$dob;
  }
  $data=['name'=>$name,'gender'=>$gender?:null,'date_of_birth'=>$dobValue,'photo'=>$photo?:null];
  if($id>0){
    $owned=$wpdb->get_var($wpdb->prepare("SELECT id FROM {$table} WHERE id=%d AND user_id=%d AND profile_type='child'",$id,$userId));
    if(!$owned) bh_json(['success'=>false,'error'=>'Child profile not found.'],404);
    $ok=$wpdb->update($table,$data,['id'=>$id,'user_id'=>$userId,'profile_type'=>'child'],['%s','%s','%s','%s'],['%d','%d','%s']);
  }else{
    $data['user_id']=$userId;$data['profile_type']='child';
    $ok=$wpdb->insert($table,$data,['%s','%s','%s','%s','%d','%s']);
    $id=(int)$wpdb->insert_id;
  }
  if($ok===false) bh_json(['success'=>false,'error'=>'Could not save child profile.'],500);
  bh_json(['success'=>true,'id'=>$id]);
}

if($action==='delete_child'){
  $id=(int)($body['id']??0);
  if($id<1) bh_json(['success'=>false,'error'=>'Child not found.'],422);
  $ok=$wpdb->delete($table,['id'=>$id,'user_id'=>$userId,'profile_type'=>'child'],['%d','%d','%s']);
  if($ok===false) bh_json(['success'=>false,'error'=>'Could not delete child profile.'],500);
  bh_json(['success'=>true]);
}

if($action==='save_bump'){
  $nickname=trim((string)($body['nickname']??''));
  $due=trim((string)($body['due_date']??''));
  $babyHere=!empty($body['baby_here'])?1:0;
  $photo=(string)($body['photo']??'');
  if(strlen($nickname)>190) bh_json(['success'=>false,'error'=>'Nickname is too long.'],422);
  if(strlen($photo)>3500000) bh_json(['success'=>false,'error'=>'Please choose a smaller photo.'],422);
  $dueValue=null;
  if($due!==''){
    $d=DateTime::createFromFormat('Y-m-d',$due);
    if(!$d||$d->format('Y-m-d')!==$due) bh_json(['success'=>false,'error'=>'Please enter a valid due date.'],422);
    $dueValue=$due;
  }
  $existing=$wpdb->get_row($wpdb->prepare("SELECT id,photo FROM {$table} WHERE user_id=%d AND profile_type='bump' ORDER BY id DESC LIMIT 1",$userId),ARRAY_A);
  $photoValue=$photo!==''?$photo:($existing['photo']??null);
  $data=['name'=>'Bump','nickname'=>$nickname?:null,'due_date'=>$dueValue,'baby_here'=>$babyHere,'photo'=>$photoValue];
  if($existing){
    $ok=$wpdb->update($table,$data,['id'=>(int)$existing['id'],'user_id'=>$userId,'profile_type'=>'bump'],['%s','%s','%s','%d','%s'],['%d','%d','%s']);
    $id=(int)$existing['id'];
  }else{
    $data['user_id']=$userId;$data['profile_type']='bump';
    $ok=$wpdb->insert($table,$data,['%s','%s','%s','%d','%s','%d','%s']);
    $id=(int)$wpdb->insert_id;
  }
  if($ok===false) bh_json(['success'=>false,'error'=>'Could not save bump profile.'],500);
  bh_json(['success'=>true,'id'=>$id]);
}

if($action==='clear_bump'){
  $ok=$wpdb->delete($table,['user_id'=>$userId,'profile_type'=>'bump'],['%d','%s']);
  if($ok===false) bh_json(['success'=>false,'error'=>'Could not clear bump profile.'],500);
  bh_json(['success'=>true]);
}

bh_json(['success'=>false,'error'=>'Unknown action.'],400);
