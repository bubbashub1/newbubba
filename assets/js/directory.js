/* Bubba Hub / Newbury - Directory Phase 1 */

(() => {
  "use strict";

  const modal = document.getElementById("heroAdvancedModal");
  const openButton = document.getElementById("heroMoreFilters");

  if (!modal || !openButton) return;

  const closeButton = document.getElementById("heroAdvancedClose");
  const form = document.getElementById("heroAdvancedForm");
  const clearButton = document.getElementById("heroAdvancedClear");
  const backdrop = modal.querySelector("[data-close-advanced]");

  const setOpen = (open) => {
    modal.hidden = !open;
    modal.setAttribute("aria-hidden", String(!open));
    openButton.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("directory-modal-open", open);

    if (open) closeButton?.focus();
    else openButton.focus();
  };

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

  if (params.get("bookingRequired") === "1") {
    document.getElementById("advancedBooking").checked = true;
  }

  if (params.get("free") === "1") {
    document.getElementById("advancedFree").checked = true;
  }

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

    for (const [key, value] of data.entries()) {
      if (!String(value).trim()) continue;

      if (key === "accessibility") {
        const existing = url.searchParams.get("accessibility");
        const values = existing ? existing.split(",") : [];
        if (!values.includes(value)) values.push(value);
        url.searchParams.set("accessibility", values.join(","));
      } else {
        url.searchParams.set(key, value);
      }
    }

    window.location.href = url.toString();
  });
})();
