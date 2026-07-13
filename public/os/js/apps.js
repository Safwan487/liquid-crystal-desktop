/* =================================================================
 * APP REGISTRY : metadata for every launchable app.
 * Real app UIs arrive in Phase 4 — for now each opens a window
 * with a themed placeholder body.
 * ================================================================= */
import { el } from "./utils.js";

export const APPS = {
  files:      { title: "Files",       icon: "fa-folder-open",    w: 780, h: 520 },
  browser:    { title: "Browser",     icon: "fa-compass",        w: 900, h: 600 },
  notepad:    { title: "Notepad",     icon: "fa-pen-to-square",  w: 620, h: 480 },
  gallery:    { title: "Gallery",     icon: "fa-image",          w: 820, h: 560 },
  music:      { title: "Music",       icon: "fa-music",          w: 560, h: 460 },
  calculator: { title: "Calculator",  icon: "fa-calculator",     w: 360, h: 520 },
  terminal:   { title: "Terminal",    icon: "fa-terminal",       w: 720, h: 460 },
  settings:   { title: "Settings",    icon: "fa-gear",           w: 760, h: 560 },
};

/** Fallback metadata for unknown / folder launches. */
export function appMeta(app) {
  return APPS[app] || { title: "Window", icon: "fa-window-maximize", w: 640, h: 460 };
}

/** Placeholder body until Phase 4 wires the real apps. */
export function placeholderBody(app, name) {
  const meta = appMeta(app);
  return el("div", { class: "window-placeholder" }, [
    el("div", { class: "ph-glyph" }, [el("i", { class: `fa-solid ${meta.icon}` })]),
    el("h2", {}, name || meta.title),
    el("p", {}, "This window is fully functional — drag the titlebar, resize from any edge, snap to the screen halves, and use the traffic-light controls. The app’s interface arrives in Phase 4."),
  ]);
}
