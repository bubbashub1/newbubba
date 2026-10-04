document.addEventListener("DOMContentLoaded", () => {
  const mount = document.querySelector("[data-planner-items]");
  const tabs = [...document.querySelectorAll(".planner-tabs button")];
  if (!mount) return;

  const esc = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const getItems = () => Object.keys(localStorage)
    .filter((key) => key.indexOf("bh_planner_item_") === 0)
    .map((key) => {
      try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; }
    })
    .filter(Boolean);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const scheduleDays = (item) => {
    const schedules = Array.isArray(item.schedules) ? item.schedules : [];
    const days = [];
    schedules.forEach((s) => {
      const raw = String(s.day || s.day_name || "").toLowerCase();
      const index = dayNames.findIndex((d) => d.toLowerCase() === raw || d.toLowerCase().startsWith(raw));
      if (index >= 0 && !days.includes(index)) days.push(index);
    });
    return days;
  };

  const itemCard = (item, extra = "") => {
    const days = scheduleDays(item);
    const scheduleText = days.length ? days.map((d) => dayShort[d]).join(", ") : "Date to be confirmed";
    return '<article class="hub-saved-card planner-item">' +
      '<div><h3>' + esc(item.title || "Activity") + '</h3>' +
      '<p>' + esc(item.venue || item.town || "") + '</p>' +
      '<p>' + esc(extra || scheduleText) + '</p></div>' +
      '<div class="hub-card-actions"><a class="button button-secondary" href="/activity?slug=' + encodeURIComponent(item.slug || "") + '">View</a>' +
      '<button class="button button-secondary" data-delete-plan="' + esc(item.id) + '">Remove</button></div></article>';
  };

  const renderList = (items) => {
    mount.innerHTML = items.length
      ? '<div class="planner-day-list">' + items.map((i) => itemCard(i)).join("") + "</div>"
      : '<div class="hub-empty"><strong>Your planner is empty</strong><p>Add an activity from an activity page.</p></div>';
  };

  const renderDay = (items) => {
    const today = new Date().getDay();
    mount.innerHTML = '<div class="planner-day-selector">' +
      dayNames.map((day, index) => '<button type="button" class="' + (index === today ? "active" : "") + '" data-day="' + index + '">' + day + "</button>").join("") +
      '</div><div data-day-results></div>';
    const draw = (day) => {
      mount.querySelectorAll("[data-day]").forEach((b) => b.classList.toggle("active", Number(b.dataset.day) === day));
      const results = items.filter((i) => scheduleDays(i).includes(day));
      const target = mount.querySelector("[data-day-results]");
      target.innerHTML = results.length ? '<div class="planner-day-list">' + results.map((i) => itemCard(i)).join("") + "</div>" :
        '<div class="hub-empty"><strong>No activities planned</strong><p>Nothing is scheduled for this day.</p></div>';
    };
    mount.querySelectorAll("[data-day]").forEach((b) => b.addEventListener("click", () => draw(Number(b.dataset.day))));
    draw(today);
  };

  const renderWeek = (items) => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    mount.innerHTML = '<div class="planner-week-grid">' + dayNames.map((day, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const results = items.filter((i) => scheduleDays(i).includes(index));
      return '<section class="planner-week-day"><h3>' + day + '</h3><small>' + date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + '</small>' +
        (results.length ? results.map((i) => '<div class="planner-mini-item"><strong>' + esc(i.title || "Activity") + '</strong><span>' + esc(i.venue || i.town || "") + '</span></div>').join("") : '<p class="planner-no-items">None</p>') +
        '</section>';
    }).join("") + "</div>";
  };

  const renderMonth = (items) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const first = new Date(year, month, 1);
    const days = new Date(year, month + 1, 0).getDate();
    let html = '<div class="planner-month-title"><strong>' + now.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) + '</strong></div><div class="planner-month-grid">';
    for (let i = 0; i < first.getDay(); i++) html += '<div class="planner-month-day planner-month-empty"></div>';
    for (let day = 1; day <= days; day++) {
      const date = new Date(year, month, day);
      const results = items.filter((i) => scheduleDays(i).includes(date.getDay()));
      html += '<section class="planner-month-day"><strong>' + day + '</strong>' +
        results.map((i) => '<div class="planner-mini-item"><span>' + esc(i.title || "Activity") + '</span></div>').join("") + '</section>';
    }
    mount.innerHTML = html + "</div>";
  };

  let currentView = "List";

  const render = () => {
    const items = getItems();
    if (currentView === "Day") renderDay(items);
    else if (currentView === "Week") renderWeek(items);
    else if (currentView === "Month") renderMonth(items);
    else renderList(items);
  };

  tabs.forEach((button) => button.addEventListener("click", () => {
    tabs.forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    currentView = button.textContent.trim();
    render();
  }));

  mount.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-plan]");
    if (!button) return;
    localStorage.removeItem("bh_planner_" + button.dataset.deletePlan);
    localStorage.removeItem("bh_planner_item_" + button.dataset.deletePlan);
    render();
  });

  window.addEventListener("storage", render);
  render();
});