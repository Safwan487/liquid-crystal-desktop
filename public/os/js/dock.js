/* =================================================================
 * DOCK : app launch buttons, running indicators, tray actions
 * ================================================================= */
import { $, $$, ripple, emit, on } from "./utils.js";
import { toggleTheme } from "./theme.js";
import { notify } from "./notifications.js";

export function initDock() {
  // App icons
  $$(".dock-item").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      ripple(e, btn);
      const app = btn.dataset.app;
      if (app === "start") {
        emit("start:toggle");
        notify("Start Menu", "Arrives in Phase 3.", "info", 2000);
        return;
      }
      // Mark as running (visual) — real windows arrive Phase 2
      btn.classList.add("running");
      emit("app:launch", { app, name: btn.querySelector(".dock-tooltip")?.textContent });
      notify(btn.querySelector(".dock-tooltip")?.textContent || app,
        "Launching… (window manager lands in Phase 2)", "info");
    });
  });

  // Tray buttons
  $$(".tray-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      ripple(e, btn);
      const kind = btn.dataset.tray;
      if (kind === "theme") toggleTheme();
      else if (kind === "search") { emit("search:toggle"); notify("Search", "Arrives in a later phase.", "info", 2000); }
      else if (kind === "center") { emit("center:toggle"); notify("Notification Center", "Arrives in a later phase.", "info", 2000); }
    });
  });

  // Sync running indicators when apps close (future phases dispatch this)
  on("app:closed", (e) => {
    const btn = $(`.dock-item[data-app="${e.detail?.app}"]`);
    btn?.classList.remove("running");
  });
}