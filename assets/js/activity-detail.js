(() => {
"use strict";
const pathParts=location.pathname.split("/").filter(Boolean);
const querySlug=new URLSearchParams(location.search).get("slug")||"";
const slug=querySlug||((pathParts[0]==="activity"&&pathParts[1])?decodeURIComponent(pathParts[1]):"");
const title=document.querySelector("[data-activity-title]");
const heroImage=document.querySelector("[data-activity-image]");
const desc=document.querySelector("[data-activity-description]");
const heroOrganiser=document.querySelector("[data-activity-hero-organiser]");
const about=document.querySelector("[data-activity-about]");
const venue=document.querySelector("[data-activity-venue]");
const organiser=document.querySelector(".activity-organiser-card[data-activity-organiser]");
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
  currentActivity=a;
  document.title=(a.title||"Activity")+" | Bubba Hub";
  if(title)title.textContent=a.title||"Activity";
  if(heroImage){const image=String(a.image_url||"").trim()||"/wp-content/uploads/logo/placeholder.jpeg";heroImage.innerHTML='<img src="'+esc(image)+'" alt="" onerror="this.onerror=null;this.src=\'/wp-content/uploads/logo/placeholder.jpeg\';">';}
  if(desc)desc.textContent=a.description||"More information about this activity will appear here.";
  if(heroOrganiser)heroOrganiser.textContent=a.organiser||"Organiser";
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
  if(venue){
  const venueName=a.venue_name||"Venue to be confirmed";
  const venueHref=a.venue_id?"/venue/"+encodeURIComponent(a.venue_id):"";
  const venueLink=venueHref?'<a class="activity-venue-name" href="'+venueHref+'">'+esc(venueName)+'</a>':'<strong>'+esc(venueName)+'</strong>';
  const address=[a.address_line_1,a.address_line_2,a.town,a.region,a.postcode].filter(Boolean).join(", ");
  venue.innerHTML='<h2>Venue</h2>'+venueLink+(address?'<p>Venue: '+esc(address)+'</p>':'');
}
if(organiser){
  const activityTitle=a.title||"Activity";
  const organiserName=a.organiser||"Organiser";
  const organiserSlug=String(organiserName).trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
  const organiserHref=organiserSlug?"/organiser.html?slug="+encodeURIComponent(organiserSlug):"";
  organiser.innerHTML='<h2>'+esc(activityTitle)+'</h2>'+
    '<h5>'+(
      organiserHref
        ? '<a class="activity-organiser-name" href="'+organiserHref+'">'+esc(organiserName)+'</a>'
        : '<span class="activity-organiser-name">'+esc(organiserName)+'</span>'
    )+'</h5>';
}
  if(contact){
    if(a.booking_url){contact.href=a.booking_url;contact.target="_blank";contact.rel="noopener";contact.textContent="Book Now";}
    else if(a.website){contact.href=a.website;contact.target="_blank";contact.rel="noopener";contact.textContent="Visit website";}
    else contact.remove();
  }
  initMap(a);
  loadSavedState(a.id);
  loadLocalActionState(a);
 }catch(e){
  if(title)title.textContent="Activity not found";
  if(desc)desc.textContent=e.message;
 }
})();
const planner=document.getElementById("addToPlanner");
const visited=document.getElementById("markVisited");
const compare=document.getElementById("compareActivity");
let currentActivity=null;
let csrfToken="";

function savedStorageKey(id){return "bh_saved_activity_"+id;}
function loadSavedState(activityId){
  if(!save)return;
  const saved=localStorage.getItem(savedStorageKey(Number(activityId)))!==null;
  save.classList.toggle("is-saved",saved);
  save.textContent=saved?"♥ Saved":"♡ Save";
}
function toggleSaved(){
  if(!currentActivity||!save)return;
  const id=Number(currentActivity.id),key=savedStorageKey(id);
  const next=localStorage.getItem(key)===null;
  if(next){
    localStorage.setItem(key,JSON.stringify({
      id,
      title:currentActivity.title||"Activity",
      slug:currentActivity.slug||slug,
      venue:currentActivity.venue_name||"",
      town:currentActivity.town||""
    }));
  }else localStorage.removeItem(key);
  save.classList.toggle("is-saved",next);
  save.textContent=next?"♥ Saved":"♡ Save";
}

function activityStorageKey(type,id){return "bh_"+type+"_"+id;}
function loadLocalActionState(a){
  const id=Number(a.id);
  const planned=localStorage.getItem(activityStorageKey("planner",id))==="1";
  const wasVisited=localStorage.getItem(activityStorageKey("visited",id))==="1";
  planner?.classList.toggle("is-saved",planned);
  if(planner)planner.textContent=planned?"✓ In Planner":"＋ Add to Planner";
  visited?.classList.toggle("is-saved",wasVisited);
  if(visited)visited.textContent=wasVisited?"✓ Visited":"○ Visited";
  let compared=false;
  try{compared=JSON.parse(localStorage.getItem("bh_compare")||"[]").some(x=>Number(x.id)===id);}catch(e){}
  compare?.classList.toggle("is-saved",compared);
  if(compare)compare.textContent=compared?"✓ Compared":"Compare";
}
function toggleLocal(type,button,onText,offText){
  if(!currentActivity||!button)return;
  const id=Number(currentActivity.id), key=activityStorageKey(type,id);
  const next=localStorage.getItem(key)!=="1";
  if(next){localStorage.setItem(key,"1");localStorage.setItem("bh_planner_item_"+id,JSON.stringify({id,title:currentActivity.title||"Activity",slug:currentActivity.slug||slug,venue:currentActivity.venue_name||"",town:currentActivity.town||"",schedules:Array.isArray(currentActivity.schedules)?currentActivity.schedules:[]}));}else{localStorage.removeItem(key);localStorage.removeItem("bh_planner_item_"+id);}
  button.classList.toggle("is-saved",next);
  button.textContent=next?onText:offText;
}
save?.addEventListener("click",toggleSaved);
planner?.addEventListener("click",()=>toggleLocal("planner",planner,"✓ In Planner","＋ Add to Planner"));
visited?.addEventListener("click",()=>toggleLocal("visited",visited,"✓ Visited","○ Visited"));
compare?.addEventListener("click",()=>{
  if(!currentActivity)return;
  const key="bh_compare";
  let items=[];
  try{items=JSON.parse(localStorage.getItem(key)||"[]");}catch(e){}
  const id=Number(currentActivity.id);
  const exists=items.some(x=>Number(x.id)===id);
  if(exists)items=items.filter(x=>Number(x.id)!==id);
  else{
    if(items.length>=3){alert("You can compare up to 3 activities.");return;}
    items.push({id:id,title:currentActivity.title||"Activity",slug:currentActivity.slug||slug});
  }
  localStorage.setItem(key,JSON.stringify(items));
  compare.classList.toggle("is-saved",!exists);
  compare.textContent=!exists?"✓ Compared":"Compare";
});
})();