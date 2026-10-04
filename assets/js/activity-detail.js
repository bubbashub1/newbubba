(() => {
"use strict";
const slug=new URLSearchParams(location.search).get("slug")||"";
const title=document.querySelector("[data-activity-title]"),desc=document.querySelector("[data-activity-description]"),about=document.querySelector("[data-activity-about]"),venue=document.querySelector("[data-activity-venue]"),facts=document.querySelector("[data-activity-facts]"),contact=document.querySelector("[data-activity-contact]"),save=document.getElementById("saveActivity");
const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];let csrf="",activityId=0;
const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
if(!slug){if(title)title.textContent="Activity not found";return;}
(async()=>{try{
const r=await fetch("/api/activities.php?slug="+encodeURIComponent(slug),{headers:{Accept:"application/json"}}),d=await r.json();
if(!r.ok||!d.success||!d.activities?.[0])throw Error(d.error||"Activity could not be loaded.");
const a=d.activities[0];activityId=Number(a.id||0);document.title=(a.title||"Activity")+" | Bubba Hub";
if(title)title.textContent=a.title||"Activity";if(desc)desc.textContent=a.description||"Family activity on Bubba Hub.";
if(about)about.innerHTML="<p>"+esc(a.description||"No description has been added yet.")+"</p>";
if(venue)venue.innerHTML="<h2>Venue</h2><p><strong>"+esc(a.venue_name||"Venue to be confirmed")+"</strong></p><p>"+esc([a.town,a.region,a.postcode].filter(Boolean).join(", "))+"</p>";
const when=(a.schedules||[]).map(x=>days[Number(x.day_of_week)]+" · "+String(x.start_time||"").slice(0,5)+(x.end_time?"–"+String(x.end_time).slice(0,5):"")).join("<br>")||"Schedule to be confirmed";
if(facts)facts.innerHTML='<div class="quick-fact"><strong>Organiser</strong><span>'+esc(a.organiser||"Bubba Hub")+'</span></div><div class="quick-fact"><strong>When</strong><span>'+when+'</span></div><div class="quick-fact"><strong>Price</strong><span>'+esc(!a.price||Number(a.price)===0?"Free":"£"+Number(a.price).toFixed(2)+" "+(a.price_type||"per session"))+"</span></div>";
if(contact){if(a.booking_url){contact.href=a.booking_url;contact.target="_blank";contact.rel="noopener";contact.textContent=Number(a.booking_required)===1?"Book this activity":"More information";}else if(a.website){contact.href=a.website;contact.target="_blank";contact.rel="noopener";contact.textContent="Visit organiser website";}else contact.remove();}
try{const sr=await fetch("/api/favourites.php",{headers:{Accept:"application/json"}});if(sr.ok){const sd=await sr.json();csrf=sd.csrf||"";const saved=(sd.activities||[]).some(x=>String(x.slug)===slug);if(save){save.dataset.saved=saved?"1":"0";save.textContent=saved?"♥ Saved":"♡ Save activity";}}}catch(_){}
}catch(e){if(title)title.textContent="Activity not found";if(desc)desc.textContent=e.message;}})();
save?.addEventListener("click",async()=>{if(!csrf||!activityId){location.href="/account.html";return;}const saved=save.dataset.saved==="1";const r=await fetch("/api/favourites.php",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({activity_id:activityId,saved:!saved,csrf})});const d=await r.json();if(d.success){save.dataset.saved=d.saved?"1":"0";save.textContent=d.saved?"♥ Saved":"♡ Save activity";}});
})();