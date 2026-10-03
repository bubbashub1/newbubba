document.addEventListener("DOMContentLoaded",()=>{document.querySelectorAll(".planner-tabs button").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".planner-tabs button").forEach(b=>b.classList.remove("active"));btn.classList.add("active")}));});

// Family page helpers are loaded only when the page contains the family list.