<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';
global $wpdb;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    bh_json(['success'=>false,'error'=>'POST required.'],405);
}

function post_string(string $key): string {
    return trim((string)($_POST[$key] ?? ''));
}
function post_int_or_null(string $key): ?int {
    $value = trim((string)($_POST[$key] ?? ''));
    return $value === '' ? null : (int)$value;
}
function post_float_or_null(string $key): ?float {
    $value = trim((string)($_POST[$key] ?? ''));
    return $value === '' ? null : (float)$value;
}
function make_slug(string $title): string {
    $slug = strtolower(trim(preg_replace('/[^a-z0-9]+/i','-',$title),'-'));
    return $slug !== '' ? $slug : 'activity';
}

$title=post_string('title');
$description=post_string('description');
$leaderId=post_int_or_null('leader_id');
if($leaderId !== null && $leaderId <= 0) $leaderId = null;
$categoryId=post_int_or_null('category_id');
$venueName=post_string('venue_name');
$town=post_string('town');
$region=post_string('region');
$postcode=post_string('postcode');
$price=post_float_or_null('price');
$priceType=post_string('price_type') ?: 'per session';
$ageMin=post_int_or_null('age_min_months');
$ageMax=post_int_or_null('age_max_months');
$sessionLength=post_int_or_null('session_length_minutes');
$bookingRequired=!empty($_POST['booking_required']) ? 1 : 0;
$bookingUrl=post_string('booking_url');
$day=(int)($_POST['day_of_week'] ?? 0);
$startTime=post_string('start_time');
$endTime=post_string('end_time');

if($title==='') bh_json(['success'=>false,'error'=>'Please enter an activity name.'],422);
if($categoryId===null) bh_json(['success'=>false,'error'=>'Please select a category.'],422);
if($venueName==='' || $town==='') bh_json(['success'=>false,'error'=>'Please enter the venue name and town.'],422);

if($leaderId !== null) {
    $leaderExists=$wpdb->get_var($wpdb->prepare(
        "SELECT id FROM ".bh_table('leaders')." WHERE id=%d",
        $leaderId
    ));
    if(!$leaderExists) bh_json(['success'=>false,'error'=>'Selected class leader was not found.'],422);
}

$categoryExists=$wpdb->get_var($wpdb->prepare("SELECT id FROM ".bh_table('categories')." WHERE id=%d",$categoryId));
if(!$categoryExists) bh_json(['success'=>false,'error'=>'Selected category was not found.'],422);

$wpdb->query('START TRANSACTION');

try {
    $slug=make_slug($title).'-'.time();

    $activityData=[
            'title'=>$title,
            'slug'=>$slug,
            'description'=>$description,
            'status'=>'published',
            'leader_id'=>$leaderId,
            'booking_required'=>$bookingRequired,
            'booking_url'=>$bookingUrl ?: null,
            'price'=>$price,
            'price_type'=>$priceType,
            'currency'=>'GBP',
            'age_min_months'=>$ageMin,
            'age_max_months'=>$ageMax,
            'session_length_minutes'=>$sessionLength,
            'term_time_only'=>!empty($_POST['term_time_only']) ? 1 : 0,
            'featured'=>0
        ];
    $activityFormats=['%s','%s','%s','%s','%d','%d','%s','%f','%s','%s','%d','%d','%d','%d','%d'];
    if($leaderId===null){ $activityData['leader_id']=null; $activityFormats[4]='%d'; }
    $ok=$wpdb->insert(bh_table('activities'),$activityData,$activityFormats);
    if(!$ok) throw new RuntimeException($wpdb->last_error ?: 'Could not save activity.');

    $activityId=(int)$wpdb->insert_id;

    $existingVenue=$wpdb->get_var($wpdb->prepare(
        "SELECT id FROM ".bh_table('venues')." WHERE name=%s AND town=%s LIMIT 1",
        $venueName,$town
    ));

    if($existingVenue) {
        $venueId=(int)$existingVenue;
    } else {
        $ok=$wpdb->insert(
            bh_table('venues'),
            [
                'name'=>$venueName,
                'town'=>$town,
                'region'=>$region,
                'postcode'=>$postcode
            ],
            ['%s','%s','%s','%s']
        );
        if(!$ok) throw new RuntimeException($wpdb->last_error ?: 'Could not save venue.');
        $venueId=(int)$wpdb->insert_id;
    }

    $ok=$wpdb->insert(
        bh_table('activity_venues'),
        ['activity_id'=>$activityId,'venue_id'=>$venueId,'is_primary'=>1],
        ['%d','%d','%d']
    );
    if(!$ok) throw new RuntimeException($wpdb->last_error ?: 'Could not link venue.');

    $ok=$wpdb->insert(
        bh_table('activity_categories'),
        ['activity_id'=>$activityId,'category_id'=>$categoryId],
        ['%d','%d']
    );
    if(!$ok) throw new RuntimeException($wpdb->last_error ?: 'Could not link category.');

    $ok=$wpdb->insert(
        bh_table('activity_schedules'),
        [
            'activity_id'=>$activityId,
            'day_of_week'=>$day,
            'start_time'=>$startTime ?: null,
            'end_time'=>$endTime ?: null,
            'active'=>1
        ],
        ['%d','%d','%s','%s','%d']
    );
    if(!$ok) throw new RuntimeException($wpdb->last_error ?: 'Could not save schedule.');

    $wpdb->query('COMMIT');

    bh_json([
        'success'=>true,
        'activity_id'=>$activityId,
        'message'=>'Activity saved and published.',
        'redirect'=>'../activity.html?id='.$activityId
    ]);
} catch(Throwable $e) {
    $wpdb->query('ROLLBACK');
    bh_json(['success'=>false,'error'=>$e->getMessage()],500);
}
