/* Rakib Hasan portfolio — interactions */
(function () {
    "use strict";

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- theme toggle ---------- */
    var toggle = document.getElementById("theme-toggle");
    var root = document.documentElement;

    function applyTheme(dark) {
        root.classList.toggle("dark", dark);
        if (toggle) toggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    }

    var stored = null;
    try { stored = localStorage.getItem("theme"); } catch (e) {}

    if (stored === "dark") applyTheme(true);
    else if (stored === "light") applyTheme(false);
    else applyTheme(window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (toggle) toggle.addEventListener("click", function () {
        var dark = !root.classList.contains("dark");
        applyTheme(dark);
        try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch (e) {}
    });

    /* ---------- rotating status line (hero only) ---------- */
    var statusEl = document.getElementById("status-text");
    var items = [
        "hermes mobile beta",
        "0dte algorithmic trading bot",
        "youtube-to-obsidian ingestion",
        "portfolio/research agents"
    ];
    var idx = 0;
    var tick = 2600;

    function rotate() {
        if (!statusEl) return;
        statusEl.classList.add("fade-out");
        setTimeout(function () {
            idx = (idx + 1) % items.length;
            statusEl.textContent = items[idx];
            statusEl.classList.remove("fade-out");
            statusEl.classList.add("fade-in");
        }, 250);
    }

    if (statusEl) {
        if (!reduced) {
            statusEl.textContent = items[0];
            setInterval(rotate, tick);
        } else {
            statusEl.textContent = items.join("  ·  ");
        }
    }

    /* ---------- terminal typing (hero only) ---------- */
    var typedEl = document.getElementById("typed-text");
    var command = "swift build --target HermesMobile";
    var i = 0;

    function typeChar() {
        if (!typedEl) return;
        if (i <= command.length) {
            typedEl.textContent = command.slice(0, i);
            i++;
            setTimeout(typeChar, 42);
        }
    }

    if (typedEl) {
        if (reduced) {
            typedEl.textContent = command;
        } else {
            setTimeout(typeChar, 700);
        }
    }

    /* ---------- reveal on scroll ---------- */
    var els = document.querySelectorAll(".reveal");
    if (reduced || !("IntersectionObserver" in window)) {
        els.forEach(function (el) { el.classList.add("visible"); });
        return;
    }

    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
            if (en.isIntersecting) {
                en.target.classList.add("visible");
                io.unobserve(en.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });

    els.forEach(function (el) { io.observe(el); });
})();