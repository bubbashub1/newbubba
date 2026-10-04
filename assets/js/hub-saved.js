document.addEventListener("DOMContentLoaded",()=>{
  const mount=document.getElementById("savedActivities");
  if(!mount)return;
  const esc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;");
  const key="bh_saved_activity_";
  const get=()=>Object.keys(localStorage).filter(k=>k.indexOf(key)===0).map(k=>{try{return JSON.parse(localStorage.getItem(k))}catch(_){return null}}).filter(Boolean);
  const render=()=>{const items=get();mount.innerHTML=items.length?'<div class="hub-saved-list">'+items.map(a=>'<article class="hub-saved-card"><div class="hub-saved-main"><div class="hub-saved-heart">♡</div><div><span class="eyebrow">Saved activity</span><h3>'+esc(a.title||"Activity")+'</h3><p>'+esc([a.venue,a.town].filter(Boolean).join(" · ")||"Details available on the activity page")+'</p></div></div><div class="hub-card-actions"><a class="button button-secondary" href="/activity?slug='+encodeURIComponent(a.slug||"")+'">View activity</a><button class="button button-secondary" type="button" data-remove-saved="'+esc(a.id)+'">Remove</button></div></article>').join("")+'</div>':'<div class="hub-empty"><strong>No saved activities yet</strong><p>When you find something your family loves, tap Save on the activity page and it will appear here.</p><a class="button" href="/directory.html">Find activities</a></div>';};
  mount.addEventListener("click",e=>{const b=e.target.closest("[data-remove-saved]");if(!b)return;localStorage.removeItem(key+b.dataset.removeSaved);render()});
  window.addEventListener("storage",render);
  render();
});