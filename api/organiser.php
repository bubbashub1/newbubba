<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';
global $wpdb;

$slug=trim((string)($_GET['slug']??''));
if($slug==='') bh_json(['success'=>false,'error'=>'Organiser not found.'],404);

$leaders=$wpdb->get_results("SELECT id,business_name,website,email,phone FROM ".bh_table('leaders')." WHERE status='published' ORDER BY business_name ASC",ARRAY_A);
$leader=null;
$makeSlug=function($value){
  $value=strtolower(trim((string)$value));
  $value=preg_replace('/[^a-z0-9]+/','-',$value);
  return trim((string)$value,'-');
};
foreach(($leaders?:[]) as $row){
  if($makeSlug($row['business_name']??'')===$slug){$leader=$row;break;}
}
if(!$leader) bh_json(['success'=>false,'error'=>'Organiser not found.'],404);

$activities=$wpdb->get_results($wpdb->prepare(
  "SELECT a.id,a.title,a.slug,a.description,a.price,a.price_type,
   (SELECT ai.image_url FROM ".bh_table('activity_images')." ai WHERE ai.activity_id=a.id ORDER BY ai.is_primary DESC,ai.id ASC LIMIT 1) image_url,
   v.name venue_name,v.town
   FROM ".bh_table('activities')." a
   LEFT JOIN ".bh_table('activity_venues')." av ON av.activity_id=a.id AND av.is_primary=1
   LEFT JOIN ".bh_table('venues')." v ON v.id=av.venue_id
   WHERE a.status='published' AND a.leader_id=%d
   ORDER BY a.title ASC",$leader['id']),ARRAY_A);

bh_json(['success'=>true,'organiser'=>$leader,'activities'=>$activities?:[]]);
