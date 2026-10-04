<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';
global $wpdb;
$id=(int)($_GET['id']??0);
if($id<1) bh_json(['success'=>false,'error'=>'Venue not found.'],404);
$venue=$wpdb->get_row($wpdb->prepare(
 "SELECT id,name,address_line_1,address_line_2,town,region,postcode,latitude,longitude
  FROM ".bh_table('venues')." WHERE id=%d AND status='published' LIMIT 1",$id),ARRAY_A);
if(!$venue) bh_json(['success'=>false,'error'=>'Venue not found.'],404);
$activities=$wpdb->get_results($wpdb->prepare(
 "SELECT a.id,a.title,a.slug,a.description,a.price,a.price_type,
  (SELECT ai.image_url FROM ".bh_table('activity_images')." ai WHERE ai.activity_id=a.id ORDER BY ai.is_primary DESC,ai.id ASC LIMIT 1) image_url,
  l.business_name organiser
  FROM ".bh_table('activities')." a
  INNER JOIN ".bh_table('activity_venues')." av ON av.activity_id=a.id AND av.venue_id=%d
  LEFT JOIN ".bh_table('leaders')." l ON l.id=a.leader_id
  WHERE a.status='published' ORDER BY a.title ASC",$id),ARRAY_A);
bh_json(['success'=>true,'venue'=>$venue,'activities'=>$activities?:[]]);
