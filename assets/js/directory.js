/* Bubba Hub - Directory data and filters */

(() => {
  "use strict";

  const API_URL = "/api/activities.php";
  const CATEGORY_API_URL = "/api/categories.php";

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
      const response = await fetch(CATEGORY_API_URL, {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
        cache: "no-store"
      });
      if (!response.ok) throw new Error("Category API returned " + response.status);
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

  let directoryMap = null;
  const directoryMarkers = new Map();

  const initDirectoryMap = (activities) => {
    const mapEl = document.getElementById("directoryActivityMap");
    if (!mapEl || typeof L === "undefined") return;

    if (!directoryMap) {
      directoryMap = L.map(mapEl).setView([50.47, -3.53], 9);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors"
      }).addTo(directoryMap);
    }

    directoryMarkers.forEach((marker) => marker.remove());
    directoryMarkers.clear();

    const bounds = [];
    activities.forEach((activity) => {
      const lat = Number(activity.latitude);
      const lng = Number(activity.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const marker = L.marker([lat, lng]).addTo(directoryMap);
      const popupImage = String(activity.image_url || "").trim() || "/wp-content/uploads/logo/placeholder.jpeg";
      const popupPrice = activity.price == null || Number(activity.price) === 0
        ? "Free"
        : "£" + Number(activity.price).toFixed(2);
      const popupAge = formatAge(activity.age_min_months, activity.age_max_months);
      const popupBadges = [
        '<span class="directory-map-popup-badge">' + escapeHtml(activity.organiser || "Family activity") + '</span>',
        activity.featured ? '<span class="directory-map-popup-badge directory-map-popup-featured">Featured</span>' : "",
        activity.booking_required ? '<span class="directory-map-popup-badge directory-map-popup-booking">Booking required</span>' : ""
      ].join("");

      marker.bindPopup(
        '<article class="directory-map-popup-card">' +
          '<a class="directory-map-popup-image" href="activity.html?slug=' + encodeURIComponent(activity.slug || "") + '">' +
            '<img src="' + escapeHtml(popupImage) + '" alt="" onerror="this.onerror=null;this.src=\'/wp-content/uploads/logo/placeholder.jpeg\';">' +
            '<div class="directory-map-popup-badges">' + popupBadges + '</div>' +
          '</a>' +
          '<div class="directory-map-popup-body">' +
            '<h3><a href="activity.html?slug=' + encodeURIComponent(activity.slug || "") + '">' + escapeHtml(activity.title || "Activity") + '</a></h3>' +
            '<div class="directory-map-popup-facts">' +
              '<span><strong>Town</strong>' + escapeHtml(activity.town || "") + '</span>' +
              '<span><strong>Price</strong>' + escapeHtml(popupPrice) + '</span>' +
            '</div>' +
            (popupAge ? '<div class="directory-map-popup-age"><strong>Age</strong>' + escapeHtml(popupAge) + '</div>' : '') +
            '<a class="button directory-map-popup-button" href="activity.html?slug=' + encodeURIComponent(activity.slug || "") + '">View activity</a>' +
          '</div>' +
        '</article>',
        { className: "directory-map-popup", maxWidth: 300, minWidth: 260 }
      );
      directoryMarkers.set(String(activity.id), marker);
      bounds.push([lat, lng]);
    });

    if (bounds.length) {
      directoryMap.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    }
  };

  const focusDirectoryActivity = (activityId) => {
    const marker = directoryMarkers.get(String(activityId));
    if (!marker || !directoryMap) return;
    directoryMap.setView(marker.getLatLng(), Math.max(directoryMap.getZoom(), 13), { animate: true });
    marker.openPopup();
    document.getElementById("directoryActivityMap")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
      const town = activity.town ? escapeHtml(activity.town) : "";
      const region = activity.region ? escapeHtml(activity.region) : "";
      const age = formatAge(activity.age_min_months, activity.age_max_months);
      const price = activity.price == null || Number(activity.price) === 0
        ? "Free"
        : `£${Number(activity.price).toFixed(2)}${activity.price_type ? " " + escapeHtml(activity.price_type) : ""}`;
      const href = `activity.html?slug=${encodeURIComponent(activity.slug || "")}`;
      const imageUrl = String(activity.image_url || "").trim() || "/wp-content/uploads/logo/placeholder.jpeg";

      const badges = [
        `<span class="directory-badge directory-badge-organiser">${escapeHtml(activity.organiser || "Family activity")}</span>`,
        activity.featured ? '<span class="directory-badge directory-badge-featured">Featured</span>' : "",
        activity.booking_required ? '<span class="directory-badge directory-badge-booking">Booking required</span>' : ""
      ].join("");

      return `
        <article class="directory-activity-card" data-activity-id="${escapeHtml(activity.id)}">
          <a class="directory-activity-card-image directory-map-focus-link" href="${href}" aria-label="View ${escapeHtml(activity.title || "activity")}">
            <img src="${escapeHtml(imageUrl)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='/wp-content/uploads/logo/placeholder.jpeg';">
            ${badges ? `<div class="directory-activity-badges">${badges}</div>` : ""}
          </a>

          <div class="directory-activity-card-body">
            <h3><a class="directory-map-focus-link" href="${href}">${escapeHtml(activity.title || "Activity")}</a></h3>

            <div class="directory-activity-location">
              ${town ? `<span><strong>Town</strong> ${town}</span>` : ""}
              ${region ? `<span><strong>Region</strong> ${region}</span>` : ""}
            </div>

            <div class="directory-activity-facts">
              ${age ? `<span><strong>Age Range</strong> ${escapeHtml(age)}</span>` : ""}
              <span><strong>Price</strong> ${price}</span>
            </div>

            <a class="button directory-view-activity" href="${href}">View activity</a>
          </div>
        </article>`;
    }).join("");

    activitiesMount.querySelectorAll("[data-activity-id]").forEach((card) => {
      card.addEventListener("click", (event) => {
        const focusLink = event.target.closest(".directory-map-focus-link");
        if (focusLink) {
          event.preventDefault();
          focusDirectoryActivity(card.dataset.activityId);
          return;
        }
        if (event.target.closest(".directory-view-activity")) return;
        focusDirectoryActivity(card.dataset.activityId);
      });
    });
  };

  const loadActivities = async () => {
    if (!activitiesMount) return;

    const params = new URLSearchParams(window.location.search);
    const apiParams = new URLSearchParams();

    ["keyword", "region", "town", "category", "day", "age_min", "age_max"].forEach((key) => {
      const value = params.get(key);
      if (value) apiParams.set(key, value);
    });

    const maxPrice = params.get("max_price");
    if (maxPrice === "0") apiParams.set("price", "free");
    else if (maxPrice) apiParams.set("price", maxPrice);

    if (params.get("bookingRequired") === "1") {
      apiParams.set("booking_required", "1");
    }
    if (params.get("termTime") === "1") {
      apiParams.set("term_time_only", "1");
    }
    if (params.get("accessibility")) {
      apiParams.set("accessibility", params.get("accessibility"));
    }

    try {
      activitiesMount.innerHTML = `
        <div class="empty-state directory-loading">
          <h3>Loading activities…</h3>
          <p>Finding family activities for you.</p>
        </div>`;

      const response = await fetch(`${API_URL}?${apiParams.toString()}`, {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
        cache: "no-store"
      });

      if (!response.ok) throw new Error("Activity API returned " + response.status);

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Activity API failed");

      const activities = Array.isArray(data.activities) ? data.activities : [];
      renderActivities(activities);
      initDirectoryMap(activities);

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
