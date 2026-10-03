(() => {
  "use strict";

  const form=document.getElementById("activityForm");
  if(!form) return;

  const message=document.getElementById("activityFormMessage");

  const loadOptions=async()=>{
    const [leadersResponse,categoriesResponse]=await Promise.all([
      fetch("../api/leaders.php",{headers:{Accept:"application/json"}}),
      fetch("../api/categories.php",{headers:{Accept:"application/json"}})
    ]);

    const leaders=await leadersResponse.json();
    const categories=await categoriesResponse.json();

    const leaderSelect=document.getElementById("leader_id");
    const categorySelect=document.getElementById("category_id");

    leaderSelect.innerHTML='<option value="">Unassigned — add leader later</option>';
    (leaders.leaders||[]).forEach(item=>{
      const option=document.createElement("option");
      option.value=item.id;
      option.textContent=item.business_name;
      leaderSelect.appendChild(option);
    });

    categorySelect.innerHTML='<option value="">Select category</option>';
    (categories.categories||[]).forEach(item=>{
      const option=document.createElement("option");
      option.value=item.id;
      option.textContent=item.name;
      categorySelect.appendChild(option);
    });
    if(!(categories.categories||[]).length){
      categorySelect.innerHTML='<option value="">No categories found</option>';
    }
  };

  form.addEventListener("submit",async(event)=>{
    event.preventDefault();
    message.textContent="Saving activity…";
    message.className="form-message";

    try{
      const response=await fetch("../api/activity-save.php",{method:"POST",body:new FormData(form),headers:{Accept:"application/json"}});
      const data=await response.json();
      if(!response.ok || !data.success) throw new Error(data.error||"The activity could not be saved.");

      message.textContent=data.message;
      message.className="form-message success";
      window.location.href=data.redirect;
    }catch(error){
      message.textContent=error.message;
      message.className="form-message error";
    }
  });

  loadOptions().catch(error=>{
    message.textContent="We couldn't load the class leaders and categories. "+error.message;
    message.className="form-message error";
  });
})();
