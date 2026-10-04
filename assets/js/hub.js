document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".planner-tabs button").forEach(btn => btn.addEventListener("click", () => {
    document.querySelectorAll(".planner-tabs button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  }));

  const upcoming = document.getElementById("hubUpcomingList");
  if (!upcoming) return;

  const esc = value => String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const getPlannerItems = () => Object.keys(localStorage)
    .filter(key => key.indexOf("bh_planner_item_") === 0)
    .map(key => { try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; } })
    .filter(Boolean);

  const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const nextOccurrence = item => {
    const explicit = item.date || item.start_date || item.startDate;
    if (explicit) {
      const date = new Date(explicit);
      if (!Number.isNaN(date.getTime()) && date >= new Date(new Date().setHours(0,0,0,0))) return date;
    }
    const schedules = Array.isArray(item.schedules) ? item.schedules : [];
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let best = null;
    schedules.forEach(schedule => {
      const raw = String(schedule.day || schedule.day_name || "").toLowerCase();
      const index = dayNames.findIndex(day => day.toLowerCase() === raw || day.toLowerCase().startsWith(raw));
      if (index < 0) return;
      const date = new Date(start);
      date.setDate(start.getDate() + ((index - start.getDay() + 7) % 7));
      if (!best || date < best) best = date;
    });
    return best;
  };
  const formatDate = date => date.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});

  const renderUpcoming = () => {
    const events = getPlannerItems().map(item => ({item,date:nextOccurrence(item)})
      .filter(entry => entry.date).sort((a,b) => a.date-b.date).slice(0,3);
    if (!events.length) {
      upcoming.innerHTML = '<div class="hub-upcoming-empty"><strong>No upcoming events</strong><span>Add activities to your planner to see them here.</span><a href="/directory.html">Find an activity →</a></div>';
      return;
    }
    upcoming.innerHTML = events.map(({item,date}) => '<a class="hub-upcoming-item" href="/activity?slug='+encodeURIComponent(item.slug||"")+'"><span class="hub-upcoming-date">'+esc(formatDate(date))+'</span><strong>'+esc(item.title||"Activity")+'</strong><small>'+esc(item.venue||item.town||"")+'</small></a>').join("");
  };
  renderUpcoming();
  window.addEventListener("storage", renderUpcoming);
});