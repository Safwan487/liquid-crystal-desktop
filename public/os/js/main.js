/* =================================================================
 * MAIN : boot sequence — wires every module together
 * ================================================================= */
import { initTheme } from "./theme.js";
import { initClock } from "./clock.js";
import { initDesktop } from "./desktop.js";
import { initDock } from "./dock.js";
import { notify } from "./notifications.js";

function boot() {
  initTheme();     // restore light/dark + accent
  initClock();     // desktop + tray clock
  initDesktop();   // icons, selection, drag, context menus
  initDock();      // dock + tray interactions

  // Welcome notification
  setTimeout(() => {
    notify("Welcome to Aurora OS", "Phase 1 ready — Desktop & Dock are live.", "success", 4200);
  }, 700);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}