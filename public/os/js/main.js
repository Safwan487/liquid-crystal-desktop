/* =================================================================
 * MAIN : boot sequence — wires every module together
 * ================================================================= */
import { initTheme } from "./theme.js";
import { initClock } from "./clock.js";
import { initDesktop } from "./desktop.js";
import { initDock } from "./dock.js";
import { initWindows } from "./window.js";
import { initStartMenu } from "./start-menu.js";
import { initSearch } from "./search.js";
import { initNotificationCenter } from "./notification-center.js";
import { notify, initNotifications } from "./notifications.js";
import { initSound } from "./sound.js";
import { initBoot } from "./boot.js";

function boot() {
  initBoot();      // brief splash on first load of the session
  initTheme();     // restore light/dark + accent
  initNotifications(); // restore toast history for the center
  initClock();     // desktop + tray clock
  initDesktop();   // icons, selection, drag, context menus
  initWindows();   // window manager (drag, resize, snap, min/max)
  initStartMenu(); // searchable start menu + power actions
  initSearch();    // global spotlight (Ctrl/⌘+K)
  initNotificationCenter(); // slide-in control center
  initDock();      // dock + tray interactions
  initSound();     // synthesized UI audio (WebAudio, zero assets)

  // ---- Subtle wallpaper parallax on pointer move ---------------
  let raf = 0;
  window.addEventListener("pointermove", (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const px = (e.clientX / window.innerWidth) - 0.5;
      const py = (e.clientY / window.innerHeight) - 0.5;
      document.documentElement.style.setProperty("--px", px.toFixed(3));
      document.documentElement.style.setProperty("--py", py.toFixed(3));
    });
  }, { passive: true });

  // ---- Global keyboard shortcut: mute audio (Ctrl/⌘+M) ---------
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "m" && !e.altKey) {
      // Don't hijack typing in inputs
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault();
      import("./sound.js").then(({ setMuted, isMuted }) => {
        setMuted(!isMuted());
        notify(isMuted() ? "Sound muted" : "Sound on", "", "info", 1600);
      });
    }
  });

  // Welcome notification
  setTimeout(() => {
    notify("Welcome to Aurora OS", "Press ⌘/Ctrl+K to search, ⌘/Ctrl+M to mute.", "success", 5200);
  }, 1600);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}