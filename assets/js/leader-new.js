(() => {
"use strict";
const form=document.getElementById("activityForm"); if(!form)return;
const message=document.getElementById("activityFormMessage"), leaderSelect=document.getElementById("leader_id"), categorySelect=document.getElementById("category_id"), submit=form.querySelector('button[type="submit"]');
let csrf="";
const load=async()=>{
 const auth=await (await fetch("../api/auth.php",{headers:{Accept:"application/json"}})).json();
 if(!auth.authenticated&&!window.BH_BUILD_MODE){message.textContent="Please sign in to add an activity.";message.className="form-message error";if(submit)submit.disabled=true;return;}
 csrf=auth.csrf||"";
 const [leaderResponse,categoryResponse]=await Promise.all([
  fetch("../api/leaders.php?action=mine",{headers:{Accept:"application/json"}}),
  fetch("../api/categories.php",{headers:{Accept:"application/json"}})
 ]);
 const leaderData=await leaderResponse.json(),categoryData=await categoryResponse.json();
 leaderSelect.innerHTML="";
 if(leaderData.leader){
  const option=document.createElement("option");option.value=leaderData.leader.id;option.textContent=leaderData.leader.business_name;leaderSelect.appendChild(option);
 }else{
  leaderSelect.innerHTML='<option value="">No linked class leader account</option>';
  message.textContent="Your account can view the leader area, but you need a linked class leader account before you can publish.";message.className="form-message error";if(submit)submit.disabled=true;
 }
 categorySelect.innerHTML='<option value="">Select category</option>';
 (categoryData.categories||[]).forEach(item=>{const o=document.createElement("option");o.value=item.id;o.textContent=item.name;categorySelect.appendChild(o);});
 if(!(categoryData.categories||[]).length)categorySelect.innerHTML='<option value="">No categories found</option>';
};
form.addEventListener("submit",async e=>{
 e.preventDefault();if(!csrf){message.textContent="Build mode is active, but a linked leader account is still required to save an activity.";message.className="form-message error";return;}
 message.textContent="Saving activity…";message.className="form-message";
 const fd=new FormData(form);fd.append("csrf",csrf);
 try{const response=await fetch("../api/activity-save.php",{method:"POST",body:fd,headers:{Accept:"application/json"}}),data=await response.json();if(!response.ok||!data.success)throw Error(data.error||"The activity could not be saved.");message.textContent=data.message;message.className="form-message success";location.href=data.redirect;}catch(error){message.textContent=error.message;message.className="form-message error";}
});
load().catch(error=>{message.textContent="We couldn't load your leader account. "+error.message;message.className="form-message error";});
})();