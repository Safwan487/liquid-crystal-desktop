/* =================================================================
 * DOCK : app launch buttons, running indicators, tray actions.
 * Now wired to the window manager — clicking toggles windows.
 * ================================================================= */
import { $, $$, ripple, emit, on } from "./utils.js";
import { toggleTheme } from "./theme.js";
import { notify } from "./notifications.js";
import { openWindow, getWindow, minimizeWindow, restoreWindow } from "./window.js";

function setRunning(app, running) {
  const btn = $(`.dock-item[data-app="${app}"]`);
  btn?.classList.toggle("running", running);
}
function setActive(app, active) {
  const btn = $(`.dock-item[data-app="${app}"]`);
  btn?.classList.toggle("active", active);
}

export function initDock() {
  // App icons
  $$(".dock-item").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      ripple(e, btn);
      const app = btn.dataset.app;
      if (app === "start") {
        emit("start:toggle");
        return;
      }
      // Toggle behaviour: open → focus → minimize / restore.
      const rec = getWindow(app);
      if (!rec) {
        openWindow({ app, name: btn.querySelector(".dock-tooltip")?.textContent });
      } else if (rec.minimized) {
        restoreWindow(rec);
      } else if (rec.node.classList.contains("focused")) {
        minimizeWindow(rec);
      } else {
        restoreWindow(rec);
      }
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

  // Sync running / active indicators with the window manager.
  on("window:open", (e) => { setRunning(e.detail.app, true); setActive(e.detail.app, true); });
  on("window:closed", (e) => { setRunning(e.detail.app, false); setActive(e.detail.app, false); });
  on("window:minimized", (e) => setActive(e.detail.app, false));
  on("window:restored", (e) => setActive(e.detail.app, true));
}
