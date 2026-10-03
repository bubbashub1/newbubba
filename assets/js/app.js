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

          <button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="main-navigation">
            <span></span><span></span><span></span>
          </button>

          <nav class="main-navigation" id="main-navigation" aria-label="Main navigation">
            ${navigation.map(([key, label, href]) => `<a href="${href}" data-nav="${key}">${label}</a>`).join("")}
          </nav>
        </div>
      </header>
    `;

    const page = document.body.dataset.page;
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

    nav.querySelectorAll("a").forEach(link => {
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