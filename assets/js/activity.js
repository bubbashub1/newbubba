(() => {
  "use strict";

  const id = new URLSearchParams(window.location.search).get("id");
  const title = document.querySelector("[data-activity-title]");
  const desc = document.querySelector("[data-activity-description]");
  const about = document.querySelector("[data-activity-about]");
  const venue = document.querySelector("[data-activity-venue]");
  const facts = document.querySelector("[data-activity-facts]");
  const contact = document.querySelector("[data-activity-contact]");
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  const esc = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const schedule = (list) => (list || []).length
    ? list.map((item) => {
        const day = days[Number(item.day_of_week)] || "";
        const start = item.start_time ? " · " + String(item.start_time).slice(0, 5) : "";
        const end = item.end_time ? "–" + String(item.end_time).slice(0, 5) : "";
        return day + start + end;
      }).join("<br>")
    : "Schedule to be confirmed";

  const price = (value, type) =>
    !value || Number(value) === 0
      ? "Free"
      : "£" + Number(value).toFixed(2) + " " + (type || "per session");

  if (!id) {
    if (title) title.textContent = "Activity not found";
    return;
  }

  fetch("/api/activities.php?id=" + encodeURIComponent(id), {
    headers: { Accept: "application/json" }
  })
    .then(async (response) => {
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Activity could not be loaded.");
      }

      const activity = Array.isArray(data.activities) ? data.activities[0] : null;

      if (!activity) {
        throw new Error("Activity not found.");
      }

      return activity;
    })
    .then((activity) => {
      document.title = (activity.title || "Activity") + " | Bubba Hub";

      if (title) title.textContent = activity.title || "Activity";
      if (desc) desc.textContent = activity.description || "Family activity on Bubba Hub.";

      const categories = (activity.categories || [])
        .map((item) => item.name)
        .filter(Boolean)
        .join(" · ");

      if (about) {
        about.innerHTML =
          (categories ? '<p class="directory-activity-tag">' + esc(categories) + "</p>" : "") +
          "<p>" + esc(activity.description || "No description has been added yet.") + "</p>";
      }

      if (venue) {
        venue.innerHTML =
          "<h2>Venue</h2>" +
          "<p><strong>" + esc(activity.venue_name || "Venue to be confirmed") + "</strong></p>" +
          "<p>" + esc([activity.town, activity.region, activity.postcode].filter(Boolean).join(", ")) + "</p>";
      }

      const age =
        activity.age_min_months !== null && activity.age_min_months !== undefined
          ? activity.age_max_months !== null && activity.age_max_months !== undefined
            ? activity.age_min_months + "–" + activity.age_max_months + " months"
            : activity.age_min_months + "+ months"
          : "";

      if (facts) {
        facts.innerHTML =
          '<div class="quick-fact"><strong>Organiser</strong><span>' + esc(activity.organiser || "Bubba Hub") + "</span></div>" +
          '<div class="quick-fact"><strong>When</strong><span>' + schedule(activity.schedules) + "</span></div>" +
          (age ? '<div class="quick-fact"><strong>Age</strong><span>' + esc(age) + "</span></div>" : "") +
          '<div class="quick-fact"><strong>Price</strong><span>' + esc(price(activity.price, activity.price_type)) + "</span></div>" +
          (activity.session_length_minutes
            ? '<div class="quick-fact"><strong>Session</strong><span>' + esc(activity.session_length_minutes) + " minutes</span></div>"
            : "") +
          (Number(activity.term_time_only) === 1
            ? '<div class="quick-fact"><strong>Availability</strong><span>Term time only</span></div>'
            : "");
      }

      if (contact) {
        if (activity.booking_url) {
          contact.href = activity.booking_url;
          contact.target = "_blank";
          contact.rel = "noopener";
          contact.textContent = Number(activity.booking_required) === 1 ? "Book this activity" : "More information";
        } else if (activity.website) {
          contact.href = activity.website;
          contact.target = "_blank";
          contact.rel = "noopener";
          contact.textContent = "Visit organiser website";
        } else {
          contact.remove();
        }
      }
    })
    .catch((error) => {
      console.error("Activity load error:", error);
      if (title) title.textContent = "Activity not found";
      if (desc) desc.textContent = error.message || "We couldn't load this activity.";
      if (about) about.innerHTML = "<p>We couldn't load this activity.</p>";
    });
})();