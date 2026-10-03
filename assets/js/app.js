/* Bubba Hub / Newbury - Phase 1
   Shared shell only. No backend or old application code. */

(() => {
  "use strict";

  const navigation = [
    ["directory", "Find activities", "directory.html"],
    ["my-hub", "My Hub", "my-hub.html"],
    ["help-support", "Support & Guidance", "help-support.html"],
    ["leader", "Class Leaders", "leader.html"],
    ["account", "My Account", "account.html"]
  ];

  const logoPath = "images/logos/gemini_generated_image_pq5i56pq5i56pq5i-removebg-preview-20260930-190428-b9e652.png";

  function renderHeader() {
    const target = document.getElementById("site-header");
    if (!target) return;

    target.innerHTML = `
      <header class="site-header">
        <div class="container header-inner">

          <a class="brand" href="index.html" aria-label="Bubba Hub home">
            <span class="brand-logo-wrap">
              <img class="brand-logo" src="${logoPath}" alt="Bubba Hub logo">
              <span class="brand-fallback">BH</span>
            </span>
            <span class="brand-name">Bubba Hub</span>
          </a>

          <button
            class="menu-toggle"
            type="button"
            aria-label="Open menu"
            aria-expanded="false"
            aria-controls="main-navigation"
          >
            <span></span><span></span><span></span>
          </button>

          <nav class="main-navigation" id="main-navigation" aria-label="Main navigation">

            <div class="nav-search-wrap">
              <button
                class="nav-search-trigger"
                type="button"
                aria-expanded="false"
                aria-controls="header-search"
              >
                Find activities
              </button>

              <div class="header-search" id="header-search" hidden>
                <form action="directory.html" method="get">

                  <div class="header-search-fields">

                    <div class="header-search-field">
                      <label for="header-keyword">What are you looking for?</label>
                      <input
                        type="search"
                        id="header-keyword"
                        name="keyword"
                        placeholder="e.g. baby massage"
                      >
                    </div>

                    <div class="header-search-field">
                      <label for="header-region">Region</label>
                      <select id="header-region" name="region">
                        <option value="">Any region</option>
                        <option value="East Cornwall">East Cornwall</option>
                        <option value="East Devon">East Devon</option>
                        <option value="Exeter">Exeter</option>
                        <option value="Mid Cornwall">Mid Cornwall</option>
                        <option value="Mid Devon">Mid Devon</option>
                        <option value="North Cornwall">North Cornwall</option>
                        <option value="North Devon">North Devon</option>
                        <option value="Plymouth">Plymouth</option>
                        <option value="South Cornwall">South Cornwall</option>
                        <option value="South Hams">South Hams</option>
                        <option value="Teignbridge">Teignbridge</option>
                        <option value="Torbay">Torbay</option>
                        <option value="West Cornwall">West Cornwall</option>
                        <option value="West Devon">West Devon</option>
                      </select>
                    </div>

                    <div class="header-search-field">
                      <label for="header-town">Town</label>
                      <input
                        type="search"
                        id="header-town"
                        name="town"
                        placeholder="e.g. Torquay"
                      >
                    </div>

                    <div class="header-search-actions">
                      <button class="button" type="submit">Search</button>
                      <a class="button button-secondary" href="directory.html">View all activities</a>
                    </div>

                  </div>

                </form>
              </div>
            </div>

            <a href="my-hub.html" data-nav="my-hub">My Hub</a>
            <a href="help-support.html" data-nav="help-support">Support &amp; Guidance</a>
            <a href="leader.html" data-nav="leader">Class Leaders</a>
            <a href="account.html" data-nav="account">My Account</a>

          </nav>
        </div>
      </header>
    `;

    const page = document.body.dataset.page;

    if (page === "directory") {
      const searchTrigger = target.querySelector(".nav-search-trigger");
      searchTrigger.classList.add("is-active");
      searchTrigger.setAttribute("aria-current", "page");
    }

    const active = target.querySelector(`[data-nav="${page}"]`);

    if (active) {
      active.classList.add("is-active");
      active.setAttribute("aria-current", "page");
    }

    const menuButton = target.querySelector(".menu-toggle");
    const nav = target.querySelector(".main-navigation");

    menuButton.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") === "true";

      menuButton.setAttribute("aria-expanded", String(!open));
      menuButton.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      nav.classList.toggle("is-open", !open);
    });

    const searchTrigger = target.querySelector(".nav-search-trigger");
    const searchPanel = target.querySelector(".header-search");

    searchTrigger.addEventListener("click", () => {
      const open = searchTrigger.getAttribute("aria-expanded") === "true";

      searchTrigger.setAttribute("aria-expanded", String(!open));
      searchPanel.hidden = open;
      searchPanel.classList.toggle("is-open", !open);

      if (!open) {
        setTimeout(() => {
          target.querySelector("#header-keyword")?.focus();
        }, 0);
      }
    });

    nav.querySelectorAll("a[data-nav]").forEach(link => {
      link.addEventListener("click", () => {
        menuButton.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      });
    });

    const logo = target.querySelector(".brand-logo");

    logo.addEventListener("error", () => {
      logo.style.display = "none";
      target.querySelector(".brand-fallback").style.display = "grid";
    });
  }

  function renderFooter() {
    const target = document.getElementById("site-footer");
    if (!target) return;

    target.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-grid">

          <div>
            <a class="footer-brand" href="index.html">Bubba Hub</a>
            <p>Your family hub for finding, planning and booking family activities.</p>
          </div>

          <div>
            <h2>Main menu</h2>
            <a href="directory.html">Find activities</a>
            <a href="my-hub.html">My Hub</a>
            <a href="help-support.html">Support &amp; Guidance</a>
            <a href="leader.html">Class Leaders</a>
            <a href="account.html">My Account</a>
          </div>

          <div>
            <h2>Legal &amp; contact</h2>
            <a href="#">Privacy</a>
            <a href="#">Terms &amp; Conditions</a>
            <a href="#">Contact</a>
          </div>

        </div>

        <div class="container footer-bottom">
          <p>&copy; ${new Date().getFullYear()} Bubba Hub</p>
        </div>
      </footer>
    `;
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderHeader();
    renderFooter();
  });
})();
