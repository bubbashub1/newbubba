(() => {
"use strict";
const message=document.getElementById("leaderListingsMessage"),list=document.getElementById("leaderListings");
const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
(async()=>{
 try{
  const auth=await (await fetch("../api/auth.php",{headers:{Accept:"application/json"}})).json();
  if(!auth.authenticated){message.textContent="Please sign in to view your listings.";return;}
  const r=await fetch("../api/activities.php?mine=1",{headers:{Accept:"application/json"}}),d=await r.json();
  if(!r.ok||!d.success)throw Error(d.error||"Could not load your listings.");
  if(!d.activities.length){message.textContent="No activities have been added to your linked leader account yet.";list.innerHTML='<a class="section-card" href="new.html"><span class="section-icon">＋</span><h2>Add an activity</h2><p>Create your first class or group.</p></a>';return;}
  message.textContent=d.count+" listing"+(d.count===1?"":"s")+" connected to your leader account.";
  list.innerHTML=d.activities.map(a=>'<article class="section-card"><span class="section-icon">📋</span><h2>'+esc(a.title)+'</h2><p>'+esc([a.venue_name,a.town].filter(Boolean).join(" · ")||"Venue to be confirmed")+'</p><p><strong>'+esc(a.status)+'</strong>'+(a.price!=null?" · "+esc(Number(a.price)===0?"Free":"£"+Number(a.price).toFixed(2)):"")+'</p><a class="button secondary" href="../activity.html?slug='+encodeURIComponent(a.slug)+'">View activity</a></article>').join("");
 }catch(e){message.textContent=e.message;message.className="section-note error";}
})();
})();