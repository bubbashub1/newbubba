/* Bubba Hub - Directory data and filters */

(() => {
  "use strict";

  const API_URL = "api/activities.php";
  const CATEGORY_API_URL = "api/categories.php";

  const modal = document.getElementById("heroAdvancedModal");
  const openButton = document.getElementById("heroMoreFilters");
  const activitiesMount = document.getElementById("directoryActivities");

  const escapeHtml = (value) => {
    const div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
  };

  const setOpen = (open) => {
    if (!modal || !openButton) return;
    modal.hidden = !open;
    modal.setAttribute("aria-hidden", String(!open));
    openButton.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("directory-modal-open", open);

    if (open) document.getElementById("heroAdvancedClose")?.focus();
    else openButton.focus();
  };

  if (modal && openButton) {
    const closeButton = document.getElementById("heroAdvancedClose");
    const form = document.getElementById("heroAdvancedForm");
    const clearButton = document.getElementById("heroAdvancedClear");
    const backdrop = modal.querySelector("[data-close-advanced]");

    openButton.addEventListener("click", () => setOpen(true));
    closeButton?.addEventListener("click", () => setOpen(false));
    backdrop?.addEventListener("click", () => setOpen(false));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) setOpen(false);
    });

    clearButton?.addEventListener("click", () => {
      form?.reset();
      const minAge = document.getElementById("advancedAgeMin");
      const maxAge = document.getElementById("advancedAgeMax");
      if (minAge) minAge.value = "0";
      if (maxAge) maxAge.value = "9";
    });

    const params = new URLSearchParams(window.location.search);
    const setValue = (id, value) => {
      const element = document.getElementById(id);
      if (element && value !== null) element.value = value;
    };

    setValue("directoryKeyword", params.get("keyword"));
    setValue("directoryRegion", params.get("region"));
    setValue("directoryTown", params.get("town"));
    setValue("directoryDay", params.get("day"));

    setValue("advancedCategory", params.get("category"));
    setValue("advancedAgeMin", params.get("age_min") || "0");
    setValue("advancedAgeMax", params.get("age_max") || "9");
    setValue("advancedPrice", params.get("max_price"));
    setValue("advancedSessionLength", params.get("sessionLength"));
    setValue("advancedSen", params.get("sen"));
    setValue("advancedTermTime", params.get("termTime"));

    const booking = document.getElementById("advancedBooking");
    const free = document.getElementById("advancedFree");

    if (booking) booking.checked = params.get("bookingRequired") === "1";
    if (free) free.checked = params.get("free") === "1";

    const selectedAccessibility = (params.get("accessibility") || "").split(",").filter(Boolean);
    document.querySelectorAll(".accessibility-option").forEach((checkbox) => {
      checkbox.checked = selectedAccessibility.includes(checkbox.value);
    });

    form?.addEventListener("submit", (event) => {
      event.preventDefault();

      const url = new URL("directory.html", document.baseURI);
      const mainForm = document.getElementById("directoryHeroSearch");

      if (mainForm) {
        new FormData(mainForm).forEach((value, key) => {
          if (String(value).trim()) url.searchParams.set(key, value);
        });
      }

      const data = new FormData(form);
      const accessibility = [];

      for (const [key, value] of data.entries()) {
        if (!String(value).trim()) continue;

        if (key === "accessibility") {
          accessibility.push(String(value));
        } else {
          url.searchParams.set(key, value);
        }
      }

      if (accessibility.length) {
        url.searchParams.set("accessibility", accessibility.join(","));
      } else {
        url.searchParams.delete("accessibility");
      }

      window.location.href = url.toString();
    });
  }

  const loadCategories = async () => {
    const select = document.getElementById("advancedCategory");
    if (!select) return;

    try {
      const response = await fetch(CATEGORY_API_URL, { headers: { Accept: "application/json" } });
      const data = await response.json();
      if (!data.success || !Array.isArray(data.categories)) return;

      const selected = new URLSearchParams(window.location.search).get("category") || "";
      select.innerHTML = '<option value="">Any category</option>';

      data.categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.slug || category.name;
        option.textContent = category.name;
        option.selected = (category.slug || category.name) === selected;
        select.appendChild(option);
      });
    } catch (error) {
      console.error("Bubba Hub category load failed:", error);
    }
  };

  const formatAge = (min, max) => {
    if (min == null && max == null) return "";
    const years = (months) => {
      const value = Number(months);
      if (!Number.isFinite(value)) return "";
      if (value < 12) return value + " months";
      const yearsValue = Math.floor(value / 12);
      return yearsValue + (yearsValue === 1 ? " year" : " years");
    };
    if (min == null) return "Up to " + years(max);
    if (max == null) return years(min) + "+";
    return years(min) + "–" + years(max);
  };

  const renderActivities = (activities) => {
    if (!activitiesMount) return;

    if (!activities.length) {
      activitiesMount.innerHTML = `
        <div class="empty-state">
          <h3>No activities found</h3>
          <p>Try changing your search or filters.</p>
          <a class="button button-secondary" href="directory.html">Clear search</a>
        </div>`;
      return;
    }

    activitiesMount.innerHTML = activities.map((activity) => {
      const venue = [activity.venue_name, activity.town].filter(Boolean).join(" · ");
      const age = formatAge(activity.age_min_months, activity.age_max_months);
      const meta = [venue, age].filter(Boolean).join(" · ");
      const price = activity.price == null || Number(activity.price) === 0
        ? "Free"
        : `£${Number(activity.price).toFixed(2)}${activity.price_type ? " " + escapeHtml(activity.price_type) : ""}`;
      const href = `activity.html?slug=${encodeURIComponent(activity.slug || "")}`;

      return `
        <article class="directory-activity-card">
          <div class="directory-activity-card-image" aria-hidden="true">👶</div>
          <div class="directory-activity-card-body">
            <span class="directory-activity-tag">${escapeHtml(activity.organiser || "Family activity")}</span>
            <h3>${escapeHtml(activity.title || "Activity")}</h3>
            <p class="directory-activity-meta">${escapeHtml(meta || "Local family activity")}</p>
            <p>${escapeHtml(activity.description || "Find out more about this family activity.")}</p>
            <div class="directory-activity-card-details">
              <strong>${price}</strong>
              ${activity.booking_required ? '<span>Booking required</span>' : ""}
            </div>
            <a class="button button-secondary" href="${href}">View activity</a>
          </div>
        </article>`;
    }).join("");
  };

  const loadActivities = async () => {
    if (!activitiesMount) return;

    const params = new URLSearchParams(window.location.search);
    const apiParams = new URLSearchParams();

    ["keyword", "region", "town", "category", "day"].forEach((key) => {
      const value = params.get(key);
      if (value) apiParams.set(key, value);
    });

    const maxPrice = params.get("max_price");
    if (maxPrice === "0") apiParams.set("price", "free");
    else if (maxPrice) apiParams.set("price", maxPrice);

    if (params.get("bookingRequired") === "1") {
      apiParams.set("booking_required", "1");
    }

    try {
      activitiesMount.innerHTML = `
        <div class="empty-state directory-loading">
          <h3>Loading activities…</h3>
          <p>Finding family activities for you.</p>
        </div>`;

      const response = await fetch(`${API_URL}?${apiParams.toString()}`, {
        headers: { Accept: "application/json" }
      });

      if (!response.ok) throw new Error("Activity API returned " + response.status);

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Activity API failed");

      renderActivities(Array.isArray(data.activities) ? data.activities : []);

      const heading = document.querySelector(".directory-results-heading p");
      if (heading) {
        heading.textContent = `${Number(data.count || 0)} activit${Number(data.count || 0) === 1 ? "y" : "ies"} found`;
      }
    } catch (error) {
      console.error("Bubba Hub activity load failed:", error);
      activitiesMount.innerHTML = `
        <div class="empty-state">
          <h3>We couldn't load the activities</h3>
          <p>Please try again in a moment. If the problem continues, the activity database connection needs checking.</p>
          <button class="button" type="button" id="directoryRetry">Try again</button>
        </div>`;
      document.getElementById("directoryRetry")?.addEventListener("click", loadActivities);
    }
  };

  loadCategories();
  loadActivities();
})();
