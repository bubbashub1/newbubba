(() => {
  "use strict";
  const id=new URLSearchParams(window.location.search).get("id");
  const title=document.querySelector("[data-activity-title]");
  const desc=document.querySelector("[data-activity-description]");
  const about=document.querySelector("[data-activity-about]");
  const venue=document.querySelector("[data-activity-venue]");
  const facts=document.querySelector("[data-activity-facts]");
  const contact=document.querySelector("[data-activity-contact]");
  const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const schedule=list=>(list||[]).length ? list.map(s=>`${days[Number(s.day_of_week)]||""}${s.start_time?" · "+s.start_time.slice(0,5):""}${s.end_time?"–"+s.end_time.slice(0,5):""}`).join("<br>") : "Schedule to be confirmed";
  const price=(v,t)=>!v||Number(v)===0?"Free":`£${Number(v).toFixed(2)} ${t||"per session"}`;

  if(!id){ if(title) title.textContent="Activity not found"; return; }

  fetch(`/api/activities.php?id=${encodeURIComponent(id)}`,{headers:{Accept:"application/json"}})
    .then(async r=>{const d=await r.json();if(!r.ok||!d.success)throw new Error(d.error||"Activity could not be loaded.");return d.activity;})
    .then(a=>{
      document.title=`${a.title} | Bubba Hub`;
      title.textContent=a.title||"Activity";
      desc.textContent=a.description||"Family activity on Bubba Hub.";
      const cats=(a.categories||[]).map(c=>c.name).join(" · ");
      about.innerHTML=`${cats?`<p class="directory-activity-tag">${esc(cats)}</p>`:""}<p>${esc(a.description||"No description has been added yet.")}</p>`;
      venue.innerHTML=`<h2>Venue</h2><p><strong>${esc(a.venue_name||"Venue to be confirmed")}</strong></p><p>${esc([a.town,a.region,a.postcode].filter(Boolean).join(", "))}</p>`;
      const age=a.age_min_months!==null&&a.age_min_months!==undefined ? (a.age_max_months!==null&&a.age_max_months!==undefined?`${a.age_min_months}–${a.age_max_months} months`:`${a.age_min_months}+ months`) : "";
      facts.innerHTML=`<div class="quick-fact"><strong>Organiser</strong><span>${esc(a.organiser||"Bubba Hub")}</span></div><div class="quick-fact"><strong>When</strong><span>${schedule(a.schedules)}</span></div>${age?`<div class="quick-fact"><strong>Age</strong><span>${esc(age)}</span></div>`:""}<div class="quick-fact"><strong>Price</strong><span>${esc(price(a.price,a.price_type))}</span></div>${a.session_length_minutes?`<div class="quick-fact"><strong>Session</strong><span>${esc(a.session_length_minutes)} minutes</span></div>`:""}${Number(a.term_time_only)===1?`<div class="quick-fact"><strong>Availability</strong><span>Term time only</span></div>`:""}`;
      if(a.booking_url){contact.href=a.booking_url;contact.target="_blank";contact.rel="noopener";contact.textContent=Number(a.booking_required)===1?"Book this activity":"More information";} else if(a.website){contact.href=a.website;contact.target="_blank";contact.rel="noopener";contact.textContent="Visit organiser website";} else {contact.remove();}
    })
    .catch(e=>{console.error("Activity load error:",e);title.textContent="Activity not found";desc.textContent=e.message;about.innerHTML="<p>We couldn't load this activity.</p>";});
})();
