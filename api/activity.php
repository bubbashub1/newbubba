<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';
global $wpdb;

$id=(int)($_GET['id']??0);
if($id<=0) bh_json(['success'=>false,'error'=>'Activity ID is required.'],400);

$sql="SELECT a.id,a.title,a.slug,a.description,a.status,a.booking_required,a.booking_url,a.price,a.price_type,a.currency,a.age_min_months,a.age_max_months,a.session_length_minutes,a.term_time_only,a.contact_email,a.contact_phone,a.website,a.featured,l.id AS leader_id,l.business_name AS organiser,v.id AS venue_id,v.name AS venue_name,v.town,v.region,v.postcode,v.latitude,v.longitude FROM ".bh_table('activities')." a LEFT JOIN ".bh_table('leaders')." l ON l.id=a.leader_id LEFT JOIN ".bh_table('activity_venues')." av ON av.activity_id=a.id AND av.is_primary=1 LEFT JOIN ".bh_table('venues')." v ON v.id=av.venue_id WHERE a.id=%d LIMIT 1";
$row=$wpdb->get_row($wpdb->prepare($sql,$id),ARRAY_A);
if($wpdb->last_error) bh_json(['success'=>false,'error'=>'Database query failed.'],500);
if(!$row) bh_json(['success'=>false,'error'=>'Activity not found.'],404);

$row['categories']=$wpdb->get_results($wpdb->prepare("SELECT c.id,c.name,c.slug FROM ".bh_table('activity_categories')." ac INNER JOIN ".bh_table('categories')." c ON c.id=ac.category_id WHERE ac.activity_id=%d ORDER BY c.name ASC",$id),ARRAY_A);
$row['schedules']=$wpdb->get_results($wpdb->prepare("SELECT day_of_week,start_time,end_time,active FROM ".bh_table('activity_schedules')." WHERE activity_id=%d AND active=1 ORDER BY day_of_week,start_time",$id),ARRAY_A);
$row['images']=$wpdb->get_results($wpdb->prepare("SELECT id,image_url,alt_text,is_primary FROM ".bh_table('activity_images')." WHERE activity_id=%d ORDER BY is_primary DESC,id ASC",$id),ARRAY_A);

bh_json(['success'=>true,'activity'=>$row]);
