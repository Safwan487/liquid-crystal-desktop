/* =================================================================
 * THEME MANAGER : light/dark + accent color, persisted
 * ================================================================= */
import { $, $$, store, emit } from "./utils.js";

export const ACCENTS = ["purple", "blue", "green", "orange", "pink", "red"];

const root = document.documentElement;

/** Apply and persist the theme (light | dark). */
export function setTheme(theme) {
  root.dataset.theme = theme;
  store.set("theme", theme);
  // Sync the tray toggle glyph
  const icon = $('[data-tray="theme"] i');
  if (icon) icon.className = theme === "dark" ? "fa-solid fa-moon" : "fa-solid fa-sun";
  emit("theme:change", { theme });
}

export function toggleTheme() {
  setTheme(root.dataset.theme === "dark" ? "light" : "dark");
}

/** Apply and persist accent color. */
export function setAccent(accent) {
  if (!ACCENTS.includes(accent)) return;
  root.dataset.accent = accent;
  store.set("accent", accent);
  $$(".swatch").forEach((s) => s.classList.toggle("active", s.dataset.accent === accent));
  emit("accent:change", { accent });
}

export function getTheme() { return root.dataset.theme; }
export function getAccent() { return root.dataset.accent; }

/** Restore persisted preferences on boot. */
export function initTheme() {
  setTheme(store.get("theme", "dark"));
  setAccent(store.get("accent", "purple"));
  document.documentElement.dataset.wallpaper = store.get("wallpaper", "aurora");
}