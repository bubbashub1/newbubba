(() => {
"use strict";
const form=document.getElementById("leaderProfileForm"),nameField=document.getElementById("business_name"),message=document.getElementById("leaderProfileMessage");
if(!form)return;
let csrf="";
const show=(text,type="")=>{message.textContent=text;message.className="form-message"+(type?" "+type:"");};
(async()=>{
 try{
  const r=await fetch("../api/leaders.php?action=profile",{headers:{Accept:"application/json"}});
  const d=await r.json();
  if(!r.ok||!d.success)throw Error(d.error||"Could not load your leader profile.");
  csrf=d.csrf||"";
  nameField.value=d.leader?.business_name||"";
 }catch(e){show(e.message,"error");form.querySelector("button").disabled=true;}
})();
form.addEventListener("submit",async e=>{
 e.preventDefault();
 try{
  const r=await fetch("../api/leaders.php?action=profile",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({csrf,business_name:nameField.value})});
  const d=await r.json();
  if(!r.ok||!d.success)throw Error(d.error||"Could not save your profile.");
  nameField.value=d.leader.business_name;show("Profile saved.","success");
 }catch(e){show(e.message,"error");}
});
})();