document.addEventListener("DOMContentLoaded",()=>{
  const key="bh_planner_settings";
  const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const defaults={default_view:"List",hidden_days:[],show_visited:true,show_completed:false};
  const read=()=>{try{return {...defaults,...JSON.parse(localStorage.getItem(key)||"{}")}}catch(_){return {...defaults}}};
  const save=d=>{localStorage.setItem(key,JSON.stringify(d));const m=document.querySelector("[data-settings-message]");if(m)m.textContent="Settings saved."};
  let settings=read();
  const view=document.querySelector('[data-setting="default_view"]');if(view)view.value=settings.default_view;
  view?.addEventListener("change",()=>{settings.default_view=view.value;save(settings)});
  const mount=document.querySelector("[data-hidden-days]");
  if(mount){mount.innerHTML=days.map((d,i)=>'<label class="hub-day-setting"><input type="checkbox" data-day="'+i+'" '+(settings.hidden_days.includes(i)?"checked":"")+'><span><strong>'+d+'</strong><small>Hide '+d.toLowerCase()+' from the planner</small></span></label>').join("");mount.querySelectorAll("input").forEach(input=>input.addEventListener("change",()=>{settings.hidden_days=[...mount.querySelectorAll("input:checked")].map(x=>Number(x.dataset.day));save(settings)}))}
  document.querySelectorAll('[data-setting="show_visited"],[data-setting="show_completed"]').forEach(input=>{input.checked=!!settings[input.dataset.setting];input.addEventListener("change",()=>{settings[input.dataset.setting]=input.checked;save(settings)})});
});