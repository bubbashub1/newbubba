document.addEventListener("DOMContentLoaded", () => {
  const safeParse = key => {
    try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (_) { return null; }
  };

  const values = Object.keys(localStorage).map(key => {
    const value = safeParse(key);
    return { key, value };
  });

  const arraysFor = (needles) => values
    .filter(({key,value}) => Array.isArray(value) && needles.some(n => key.toLowerCase().includes(n)))
    .flatMap(({value}) => value);

  const countByKey = needles => values
    .filter(({key}) => needles.some(n => key.toLowerCase().includes(n)))
    .reduce((total, {value}) => total + (Array.isArray(value) ? value.length : value ? 1 : 0), 0);

  const saved = arraysFor(["saved","bookmark"]);
  const planner = arraysFor(["planner"]);
  const bookings = arraysFor(["booking"]);
  const family = arraysFor(["family","child","profile"]);

  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
  };

  set("hubSavedCount", saved.length || countByKey(["saved","bookmark"]));
  set("hubPlannerCount", planner.length || countByKey(["planner"]));
  set("hubBookingCount", bookings.length || countByKey(["booking"]));
  set("hubFamilyCount", family.length || countByKey(["family","child","profile"]));

  const familyTitle = document.getElementById("hubFamilyTitle");
  const familyText = document.getElementById("hubFamilyText");
  if (family.length) {
    familyTitle.textContent = "Your family is set up";
    familyText.textContent = "Your family details are ready to use across My Hub.";
  }

  const renderList = (id, items, emptyTitle, emptyText, href) => {
    const target = document.getElementById(id);
    if (!target || !items.length) return;
    target.innerHTML = items.slice(0,3).map(item => {
      const title = item.title || item.name || "Activity";
      const detail = item.venue || item.town || item.date || "";
      const slug = item.slug ? encodeURIComponent(item.slug) : "";
      return '<a class="hub-list-item" href="' + (slug ? '/activity?slug=' + slug : href) + '"><strong>' +
        String(title).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])) +
        '</strong><small>' + String(detail).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])) +
        '</small></a>';
    }).join("");
  };

  renderList("hubSaved", saved, "", "", "/hub/saved.html");
  renderList("hubVisited", arraysFor(["visited"]), "", "", "/hub/visited.html");
  renderList("hubRecent", arraysFor(["recent"]), "", "", "/hub/recently-viewed.html");
  renderList("hubBookings", bookings, "", "", "/hub/bookings.html");

  const brief = document.getElementById("hubBrief");
  if (brief && family.length) {
    brief.innerHTML = '<div class="hub-brief-items"><div><strong>Family profiles</strong><span>' + family.length + '</span></div><div><strong>Saved activities</strong><span>' + saved.length + '</span></div><div><strong>Planned activities</strong><span>' + planner.length + '</span></div></div>';
  }
});