/* Bubba Hub — shared site shell */

(() => {
  "use strict";

  const navigation = [
    ["directory", "Find activities", "directory.html"],
    ["my-hub", "My Hub", "my-hub.html"],
    ["help-support", "Support & Guidance", "help-support.html"],
    ["leader", "Class Leaders", "leader.html"],
    ["account", "My Account", "account.html"]
  ];

  const logoPath = "/images/logos/gemini_generated_image_t65ztnt65ztnt65z-20260930-185704-7e0755.jpeg";

  function renderHeader() {
    const target = document.getElementById("site-header");
    if (!target) return;

    target.innerHTML = `
      <header class="site-header">
        <div class="container header-inner">

          <a class="brand" href="/" aria-label="Bubba Hub home">
            <span class="brand-logo-wrap">
              <img class="brand-logo" src="${logoPath}" alt="Bubba Hub">
              <span class="brand-fallback" aria-hidden="true">BH</span>
            </span>
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
              >Find activities</button>

              <div class="header-search" id="header-search" hidden>
                <form action="/directory.html" method="get">
                  <div class="header-search-fields">

                    <div class="header-search-field">
                      <label for="header-keyword">What are you looking for?</label>
                      <input type="search" id="header-keyword" name="keyword" placeholder="e.g. baby massage">
                    </div>

                    <div class="header-search-field">
                      <label for="header-region">Region</label>
                      <select id="header-region" name="region">
                        <option value="">Any region</option>
                        <option>East Cornwall</option>
                        <option>East Devon</option>
                        <option>Exeter</option>
                        <option>Mid Cornwall</option>
                        <option>Mid Devon</option>
                        <option>North Cornwall</option>
                        <option>North Devon</option>
                        <option>Plymouth</option>
                        <option>South Cornwall</option>
                        <option>South Hams</option>
                        <option>Teignbridge</option>
                        <option>Torbay</option>
                        <option>West Cornwall</option>
                        <option>West Devon</option>
                      </select>
                    </div>

                    <div class="header-search-field">
                      <label for="header-town">Town</label>
                      <input type="search" id="header-town" name="town" placeholder="e.g. Torquay">
                    </div>

                  </div>

                  <div class="header-search-actions">
                    <button class="button" type="submit">Search</button>
                    <a class="button button-secondary" href="/directory.html">View all activities</a>
                  </div>
                </form>
              </div>
            </div>

            ${navigation.slice(1).map(([key, label, href]) =>
              `<a href="/${href}" data-nav="${key}">${label}</a>`
            ).join("")}

          </nav>
        </div>
      </header>
    `;

    const page = document.body.dataset.page;
    const active = target.querySelector(`[data-nav="${page}"]`);

    if (page === "directory") {
      target.querySelector(".nav-search-trigger")?.classList.add("is-active");
    }

    if (active) {
      active.classList.add("is-active");
      active.setAttribute("aria-current", "page");
    }

    const menuButton = target.querySelector(".menu-toggle");
    const nav = target.querySelector(".main-navigation");
    const searchTrigger = target.querySelector(".nav-search-trigger");
    const searchPanel = target.querySelector(".header-search");

    const closeSearch = () => {
      searchTrigger.setAttribute("aria-expanded", "false");
      searchPanel.hidden = true;
      searchPanel.classList.remove("is-open");
    };

    const closeMenu = () => {
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open menu");
      nav.classList.remove("is-open");
    };

    menuButton.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") === "true";
      if (open) {
        closeMenu();
      } else {
        menuButton.setAttribute("aria-expanded", "true");
        menuButton.setAttribute("aria-label", "Close menu");
        nav.classList.add("is-open");
      }
    });

    searchTrigger.addEventListener("click", () => {
      const open = searchTrigger.getAttribute("aria-expanded") === "true";

      if (open) {
        closeSearch();
        return;
      }

      searchTrigger.setAttribute("aria-expanded", "true");
      searchPanel.hidden = false;
      searchPanel.classList.add("is-open");

      requestAnimationFrame(() => {
        target.querySelector("#header-keyword")?.focus();
      });
    });

    nav.querySelectorAll("a[data-nav]").forEach(link => {
      link.addEventListener("click", () => {
        closeMenu();
        closeSearch();
      });
    });

    document.addEventListener("click", event => {
      if (!target.contains(event.target)) {
        closeSearch();
        closeMenu();
      }
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
            <a class="footer-brand" href="/">Bubba Hub</a>
            <p>Your family hub for finding, planning and booking family activities.</p>
          </div>

          <div>
            <h2>Main menu</h2>
            <a href="/directory.html">Find activities</a>
            <a href="/hub/my-hub.html">My Hub</a>
            <a href="/help-support.html">Support &amp; Guidance</a>
            <a href="/leader.html">Class Leaders</a>
            <a href="/account.html">My Account</a>
          </div>

          <div>
            <h2>Legal &amp; contact</h2>
            <a href="/legal/privacy.html">Privacy</a>
            <a href="/legal/terms.html">Terms &amp; Conditions</a>
            <a href="/support/contact.html">Contact</a>
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
