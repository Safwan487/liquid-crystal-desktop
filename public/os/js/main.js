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

function boot() {
  initTheme();     // restore light/dark + accent
  initNotifications(); // restore toast history for the center
  initClock();     // desktop + tray clock
  initDesktop();   // icons, selection, drag, context menus
  initWindows();   // window manager (drag, resize, snap, min/max)
  initStartMenu(); // searchable start menu + power actions
  initSearch();    // global spotlight (Ctrl/⌘+K)
  initNotificationCenter(); // slide-in control center
  initDock();      // dock + tray interactions

  // Welcome notification
  setTimeout(() => {
    notify("Welcome to Aurora OS", "Press ⌘/Ctrl+K to search. Click the bell to open Control Center.", "success", 4600);
  }, 700);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}