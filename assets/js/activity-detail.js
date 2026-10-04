(() => {
"use strict";
const slug=new URLSearchParams(location.search).get("slug")||"";
const title=document.querySelector("[data-activity-title]");
const heroImage=document.querySelector("[data-activity-image]");
const desc=document.querySelector("[data-activity-description]");
const about=document.querySelector("[data-activity-about]");
const venue=document.querySelector("[data-activity-venue]");
const facts=document.querySelector("[data-activity-facts]");
const categories=document.querySelector("[data-activity-categories]");
const schedule=document.querySelector("[data-activity-schedule]");
const contact=document.querySelector("[data-activity-contact]");
const save=document.getElementById("saveActivity");
const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
if(!slug){if(title)title.textContent="Activity not found";return;}

function formatPrice(a){
  return !a.price||Number(a.price)===0 ? "Free" : "£"+Number(a.price).toFixed(2)+(a.price_type?" "+a.price_type:"");
}
function formatSchedule(items){
  if(!Array.isArray(items)||!items.length)return '<p>Schedule to be confirmed</p>';
  return items.map(x=>'<div class="activity-schedule-row"><strong>'+esc(days[Number(x.day_of_week)]||"Session")+'</strong><span>'+esc(String(x.start_time||"").slice(0,5))+(x.end_time?" – "+esc(String(x.end_time).slice(0,5)):"")+'</span></div>').join("");
}
function initMap(a){
  const el=document.getElementById("activityDetailMap");
  if(!el||typeof L==="undefined")return;
  const lat=Number(a.latitude),lng=Number(a.longitude);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)){el.innerHTML='<div class="activity-map-empty">Location map unavailable</div>';return;}
  const map=L.map(el,{scrollWheelZoom:false}).setView([lat,lng],14);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap contributors"}).addTo(map);
  L.marker([lat,lng]).addTo(map).bindPopup("<strong>"+esc(a.venue_name||a.title||"Activity")+"</strong>").openPopup();
}

(async()=>{
 try{
  const r=await fetch("/api/activities.php?slug="+encodeURIComponent(slug),{headers:{Accept:"application/json"}});
  const d=await r.json();
  if(!r.ok||!d.success||!d.activities?.[0])throw Error(d.error||"Activity could not be loaded.");
  const a=d.activities[0];
  document.title=(a.title||"Activity")+" | Bubba Hub";
  if(title)title.textContent=a.title||"Activity";
  if(heroImage){const image=String(a.image_url||"").trim()||"/wp-content/uploads/logo/placeholder.jpeg";heroImage.innerHTML='<img src="'+esc(image)+'" alt="" onerror="this.onerror=null;this.src=\'/wp-content/uploads/logo/placeholder.jpeg\';">';}
  if(desc)desc.textContent=a.description||"More information about this activity will appear here.";
  if(about)about.innerHTML="<p>"+esc(a.description||"More information about this activity will appear here.")+"</p>";
  if(categories){
    const cats=Array.isArray(a.categories)?a.categories:[];
    const names=cats.map(x=>typeof x==="string"?x:x.name).filter(Boolean);
    if(a.town)names.push(a.town);
    categories.innerHTML=names.map(x=>'<span>'+esc(x)+'</span>').join("");
  }
  const scheduleHtml=formatSchedule(a.schedules);
  if(schedule)schedule.innerHTML=scheduleHtml;
  if(facts){
    facts.innerHTML=[
      ["Price",formatPrice(a)],
      ["Age range",a.age_min_months!=null?(a.age_max_months!=null?a.age_min_months+"–"+a.age_max_months+" months":"From "+a.age_min_months+" months"):"All ages"],
      ["Location",a.town||"See venue"],
      ["Sessions",a.schedules?.length?"See schedule":"See schedule"],
      ["Term time",a.term_time_only?"Term time":"See schedule"],
      ["Session length",a.session_length_minutes?a.session_length_minutes+" mins":"See schedule"]
    ].map(x=>'<div class="activity-detail-fact"><small>'+esc(x[0])+'</small><strong>'+esc(x[1])+'</strong></div>').join("");
  }
  if(venue)venue.innerHTML='<h2>Venue</h2><strong>'+esc(a.venue_name||"Venue to be confirmed")+'</strong><p>'+esc([a.address,a.town,a.region,a.postcode].filter(Boolean).join(", "))+'</p>';
  if(contact){
    if(a.booking_url){contact.href=a.booking_url;contact.target="_blank";contact.rel="noopener";contact.textContent="Book Now";}
    else if(a.website){contact.href=a.website;contact.target="_blank";contact.rel="noopener";contact.textContent="Visit website";}
    else contact.remove();
  }
  initMap(a);
 }catch(e){
  if(title)title.textContent="Activity not found";
  if(desc)desc.textContent=e.message;
 }
})();
save?.addEventListener("click",()=>{save.classList.toggle("is-saved");save.textContent=save.classList.contains("is-saved")?"♥ Saved":"♡ Save";});
})();