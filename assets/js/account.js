document.addEventListener("DOMContentLoaded",()=>{
  const buildMode=window.BH_BUILD_MODE===true;
  const login=document.querySelector("[data-account-login]");
  const dashboard=document.querySelector("[data-account-dashboard]");
  const intro=document.querySelector("[data-account-intro]");
  if(buildMode){
    if(login){login.hidden=true;login.style.setProperty("display","none","important");}
    if(dashboard){dashboard.hidden=false;dashboard.style.removeProperty("display");}
    if(intro) intro.textContent="Build mode is active — login is temporarily disabled.";
    return;
  }
  const form=document.querySelector("[data-account-form]");
  if(!form)return;
  const mode=form.querySelector("[data-auth-mode]"),name=form.querySelector("[name=name]"),email=form.querySelector("[name=email]"),password=form.querySelector("[name=password]"),message=form.querySelector("[data-form-message]");
  let csrf="";
  fetch("/api/auth.php").then(r=>r.json()).then(d=>{
    csrf=d.csrf||"";
    if(d.authenticated){login?.setAttribute("hidden","");dashboard?.removeAttribute("hidden");if(intro)intro.textContent="Manage your Bubba Hub account, profile and preferences."}
  });
  form.addEventListener("submit",async e=>{e.preventDefault();const action=mode.value;const body={action,csrf,email:email.value,password:password.value,name:name?.value||""};const r=await fetch("/api/auth.php",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const d=await r.json();message.textContent=d.message||d.error||"";if(d.success)window.location.reload();});
});