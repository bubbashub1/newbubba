<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';
global $wpdb;
if(session_status()!==PHP_SESSION_ACTIVE) session_start();
$mine=isset($_GET['mine']) && $_GET['mine']==='1';
$userId=(int)($_SESSION['bh_user_id']??0);

$keyword=trim((string)($_GET['keyword']??''));
$region=trim((string)($_GET['region']??''));
$town=trim((string)($_GET['town']??''));
$category=trim((string)($_GET['category']??''));
$day=strtolower(trim((string)($_GET['day']??'')));
$price=trim((string)($_GET['price']??''));
$booking=isset($_GET['booking_required'])?(int)$_GET['booking_required']:null;
$termTime=isset($_GET['term_time_only'])?(int)$_GET['term_time_only']:null;
$accessibility=trim((string)($_GET['accessibility']??''));
$id=(int)($_GET['id']??0);
$slug=trim((string)($_GET['slug']??''));
$params=["published"];
if($mine){
 if($userId<1) bh_json(['success'=>false,'error'=>'login_required'],401);
 $leaderId=(int)($wpdb->get_var($wpdb->prepare("SELECT leader_id FROM bh_leader_users WHERE user_id=%d",$userId))??0);
 if($leaderId<1) bh_json(['success'=>true,'count'=>0,'activities'=>[],'leader'=>null]);
}

$sql="SELECT DISTINCT a.id,a.title,a.slug,a.description,a.status,a.booking_required,a.booking_url,a.price,a.price_type,a.currency,a.age_min_months,a.age_max_months,a.session_length_minutes,a.term_time_only,(SELECT ai.image_url FROM bh_activity_images ai WHERE ai.activity_id=a.id ORDER BY ai.is_primary DESC,ai.id ASC LIMIT 1) AS image_url,a.contact_email,a.contact_phone,a.website,a.featured,l.id AS leader_id,l.business_name AS organiser,v.id AS venue_id,v.name AS venue_name,v.address_line_1,v.address_line_2,v.town,v.region,v.postcode,v.latitude,v.longitude
FROM ".bh_table('activities')." a
LEFT JOIN ".bh_table('leaders')." l ON l.id=a.leader_id
LEFT JOIN ".bh_table('activity_venues')." av ON av.activity_id=a.id AND av.is_primary=1
LEFT JOIN ".bh_table('venues')." v ON v.id=av.venue_id
WHERE a.status=%s

";
if($mine){ $sql.=" AND a.leader_id=%d"; $params[]=$leaderId; }
if($id>0){ $sql.=" AND a.id=%d"; $params[]=$id; }
if($slug!==''){ $sql.=" AND a.slug=%s"; $params[]=$slug; }
if($keyword!==''){ $like='%'.$wpdb->esc_like($keyword).'%'; $sql.=" AND (a.title LIKE %s OR a.description LIKE %s OR l.business_name LIKE %s)"; array_push($params,$like,$like,$like); }
if($region!==''){ $sql.=" AND v.region=%s"; $params[]=$region; }
if($town!==''){ $sql.=" AND v.town=%s"; $params[]=$town; }
if($category!==''){ $sql.=" AND EXISTS (SELECT 1 FROM ".bh_table('activity_categories')." ac INNER JOIN ".bh_table('categories')." c ON c.id=ac.category_id WHERE ac.activity_id=a.id AND (c.name=%s OR c.slug=%s))"; array_push($params,$category,$category); }

$days=['sunday'=>0,'monday'=>1,'tuesday'=>2,'wednesday'=>3,'thursday'=>4,'friday'=>5,'saturday'=>6];
if(isset($days[$day])){ $sql.=" AND EXISTS (SELECT 1 FROM ".bh_table('activity_schedules')." s WHERE s.activity_id=a.id AND s.day_of_week=%d AND s.active=1)"; $params[]=$days[$day]; }

if(isset($_GET['age_min']) && $_GET['age_min']!==''){ $sql.=' AND (a.age_max_months IS NULL OR a.age_max_months >= %d)'; $params[]=(int)$_GET['age_min']; }
if(isset($_GET['age_max']) && $_GET['age_max']!==''){ $sql.=' AND (a.age_min_months IS NULL OR a.age_min_months <= %d)'; $params[]=(int)$_GET['age_max']; }
if($booking!==null){ $sql.=" AND a.booking_required=%d"; $params[]=$booking?1:0; }
if($termTime!==null){ $sql.=" AND a.term_time_only=%d"; $params[]=$termTime?1:0; }
if($accessibility!==''){
 foreach(array_filter(array_map('trim',explode(',',$accessibility))) as $accessValue){ $sql.=" AND EXISTS (SELECT 1 FROM ".bh_table('activity_accessibility')." aa WHERE aa.activity_id=a.id AND aa.accessibility_key=%s)"; $params[]=$accessValue; }
}

switch($price){
    case 'free': $sql.=" AND (a.price IS NULL OR a.price=0)"; break;
    case '5': $sql.=" AND a.price<=5"; break;
    case '10': $sql.=" AND a.price<=10"; break;
    case '15': $sql.=" AND a.price<=15"; break;
    case '20': $sql.=" AND a.price<=20"; break;
    case '30': $sql.=" AND a.price<=30"; break;
    case 'over30': $sql.=" AND a.price>30"; break;
}

$sql.=" ORDER BY a.featured DESC,a.title ASC";
$query=$params?$wpdb->prepare($sql,...$params):$sql;
$rows=$wpdb->get_results($query,ARRAY_A);

if($wpdb->last_error) bh_json(['success'=>false,'error'=>'Database query failed.'],500);
if(($id>0 || $slug!=='') && !$rows) bh_json(['success'=>false,'error'=>'Activity not found.'],404);

if(($id>0 || $slug!=='') && $rows){
    $activityId=(int)$rows[0]['id'];

    $categories=$wpdb->get_results($wpdb->prepare(
        "SELECT c.id,c.name,c.slug
         FROM ".bh_table('activity_categories')." ac
         INNER JOIN ".bh_table('categories')." c ON c.id=ac.category_id
         WHERE ac.activity_id=%d ORDER BY c.name ASC",
        $activityId
    ),ARRAY_A);

    $schedules=$wpdb->get_results($wpdb->prepare(
        "SELECT day_of_week,start_time,end_time,active
         FROM ".bh_table('activity_schedules')."
         WHERE activity_id=%d AND active=1
         ORDER BY day_of_week,start_time",
        $activityId
    ),ARRAY_A);

    $rows[0]['categories']=$categories ?: [];
    $rows[0]['schedules']=$schedules ?: [];
}

bh_json(['success'=>true,'count'=>count($rows),'activities'=>$rows]);