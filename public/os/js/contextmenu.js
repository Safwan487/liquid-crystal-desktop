/* =================================================================
 * CONTEXT MENU : reusable glass right-click menu builder
 * ================================================================= */
import { $, el, clamp } from "./utils.js";
import { ACCENTS, getAccent, setAccent } from "./theme.js";

const menuEl = $("#context-menu");

/** Close the open context menu. */
export function closeMenu() {
  menuEl.hidden = true;
  menuEl.innerHTML = "";
}

/**
 * Open a context menu at (x, y) built from an item spec array.
 * Item shapes:
 *   { label, icon, onClick, danger, disabled }
 *   { type: "sep" }
 *   { type: "label", label }
 *   { type: "accents" }
 */
export function openMenu(x, y, items) {
  menuEl.innerHTML = "";

  for (const item of items) {
    if (item.type === "sep") { menuEl.append(el("div", { class: "context-sep" })); continue; }
    if (item.type === "label") { menuEl.append(el("div", { class: "context-label" }, item.label)); continue; }
    if (item.type === "accents") { menuEl.append(buildAccents()); continue; }

    const btn = el("button", {
      class: `context-item${item.danger ? " danger" : ""}`,
      ...(item.disabled ? { disabled: "" } : {}),
    }, [
      el("i", { class: `fa-solid ${item.icon || "fa-circle"}` }),
      el("span", {}, item.label),
    ]);
    btn.addEventListener("click", () => { closeMenu(); item.onClick?.(); });
    menuEl.append(btn);
  }

  // Position (flip if overflowing viewport)
  menuEl.hidden = false;
  const { offsetWidth: w, offsetHeight: h } = menuEl;
  menuEl.style.left = `${clamp(x, 8, window.innerWidth - w - 8)}px`;
  menuEl.style.top = `${clamp(y, 8, window.innerHeight - h - 8)}px`;
}

/** Accent color swatch row. */
function buildAccents() {
  const wrap = el("div", { class: "context-swatches" });
  for (const a of ACCENTS) {
    const s = el("button", {
      class: `swatch${a === getAccent() ? " active" : ""}`,
      dataset: { accent: a },
      title: a,
    });
    s.style.background = `hsl(var(--_h-${a}))`;
    // inline color per accent (kept simple & explicit)
    const map = { purple: "265 84% 66%", blue: "214 90% 60%", green: "152 62% 48%", orange: "26 92% 56%", pink: "328 82% 64%", red: "2 82% 60%" };
    s.style.background = `hsl(${map[a]})`;
    s.addEventListener("click", (e) => { e.stopPropagation(); setAccent(a); buildAccentsRefresh(); });
    wrap.append(s);
  }
  return wrap;
}

function buildAccentsRefresh() {
  $("#context-menu .context-swatches")?.replaceWith(buildAccents());
}

// Dismiss on outside click / escape / scroll
document.addEventListener("pointerdown", (e) => {
  if (!menuEl.hidden && !menuEl.contains(e.target)) closeMenu();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
window.addEventListener("blur", closeMenu);