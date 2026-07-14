/* =================================================================
 * START MENU : pinned + all-apps grid, live search, recents,
 *              power actions, full keyboard navigation.
 * ================================================================= */
import { $, el, on, emit, store, ripple } from "./utils.js";
import { APPS } from "./apps.js";
import { openWindow } from "./window.js";
import { notify } from "./notifications.js";
import { toggleTheme } from "./theme.js";

const PINNED_DEFAULT = ["files", "browser", "notepad", "gallery", "music", "calculator", "terminal", "settings"];
const MAX_RECENTS = 6;

let scrim, menu, input, grid, recentsWrap, sectionLabel, empty;
let open = false;
let filtered = [];   // current visible app ids
let activeIdx = 0;

/* ------------------ Public API ------------------ */
export function toggleStartMenu() { open ? closeStart() : openStart(); }
export function openStart() {
  if (open) return;
  open = true;
  render();
  scrim.classList.add("open");
  $(`.dock-item[data-app="start"]`)?.classList.add("active");
  requestAnimationFrame(() => { input.value = ""; input.focus(); });
}
export function closeStart() {
  if (!open) return;
  open = false;
  scrim.classList.remove("open");
  $(`.dock-item[data-app="start"]`)?.classList.remove("active");
}

/* ------------------ Recents ------------------ */
function getRecents() { return store.get("recents", []); }
function pushRecent(id) {
  const r = [id, ...getRecents().filter((x) => x !== id)].slice(0, MAX_RECENTS);
  store.set("recents", r);
}

/* ------------------ Launch ------------------ */
function launch(id) {
  const meta = APPS[id];
  if (!meta) return;
  pushRecent(id);
  closeStart();
  openWindow({ app: id, name: meta.title });
}

/* ------------------ Rendering ------------------ */
function render() {
  const q = (input?.value || "").trim().toLowerCase();
  const all = Object.entries(APPS);
  const list = q
    ? all.filter(([id, m]) => id.includes(q) || m.title.toLowerCase().includes(q))
    : all.filter(([id]) => PINNED_DEFAULT.includes(id));

  sectionLabel.textContent = q ? `Results (${list.length})` : "Pinned";
  grid.innerHTML = "";
  filtered = list.map(([id]) => id);
  activeIdx = 0;

  if (list.length === 0) {
    empty.hidden = false;
    grid.hidden = true;
  } else {
    empty.hidden = true;
    grid.hidden = false;
    list.forEach(([id, meta], i) => grid.appendChild(tile(id, meta, i === 0)));
  }

  // Recents block only when not searching
  const recents = getRecents();
  recentsWrap.innerHTML = "";
  if (!q && recents.length) {
    recentsWrap.appendChild(
      el("div", { class: "start-section-label" }, "Recent"),
    );
    const row = el("div", { class: "start-recents" });
    recents.forEach((id) => {
      const m = APPS[id]; if (!m) return;
      row.appendChild(
        el("button", {
          class: "start-chip",
          onclick: () => launch(id),
        }, [
          el("i", { class: `fa-solid ${m.icon}` }),
          m.title,
        ]),
      );
    });
    recentsWrap.appendChild(row);
    recentsWrap.hidden = false;
  } else {
    recentsWrap.hidden = true;
  }
}

function tile(id, meta, active) {
  const btn = el("button", {
    class: `start-tile${active ? " active" : ""}`,
    dataset: { app: id },
    onclick: (e) => { ripple(e, btn); launch(id); },
  }, [
    el("div", { class: "tile-glyph" }, [el("i", { class: `fa-solid ${meta.icon}` })]),
    el("div", { class: "tile-label" }, meta.title),
  ]);
  return btn;
}

function setActive(idx) {
  const tiles = grid.querySelectorAll(".start-tile");
  if (!tiles.length) return;
  activeIdx = (idx + tiles.length) % tiles.length;
  tiles.forEach((t, i) => t.classList.toggle("active", i === activeIdx));
  tiles[activeIdx].scrollIntoView({ block: "nearest" });
}

/* ------------------ Keyboard ------------------ */
function onKeydown(e) {
  if (!open) return;
  if (e.key === "Escape") { e.preventDefault(); closeStart(); return; }
  if (e.key === "Enter") {
    e.preventDefault();
    const id = filtered[activeIdx];
    if (id) launch(id);
    return;
  }
  const tiles = grid.querySelectorAll(".start-tile");
  if (!tiles.length) return;
  const cols = Math.max(1, Math.floor(grid.clientWidth / 112));
  if (e.key === "ArrowRight") { e.preventDefault(); setActive(activeIdx + 1); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); setActive(activeIdx - 1); }
  else if (e.key === "ArrowDown") { e.preventDefault(); setActive(activeIdx + cols); }
  else if (e.key === "ArrowUp") { e.preventDefault(); setActive(activeIdx - cols); }
}

/* ------------------ Power actions ------------------ */
function powerAction(kind) {
  closeStart();
  if (kind === "theme") { toggleTheme(); return; }
  if (kind === "lock") { notify("Locked", "The workspace is locked.", "info", 2200); return; }
  if (kind === "sleep") {
    document.body.style.transition = "opacity 400ms var(--ease-out)";
    document.body.style.opacity = "0.05";
    setTimeout(() => { document.body.style.opacity = "1"; notify("Woke up", "Welcome back.", "success", 2000); }, 900);
    return;
  }
  if (kind === "restart" || kind === "shutdown") {
    const overlay = el("div", {
      style: "position:fixed;inset:0;z-index:99999;background:var(--bg-0);display:grid;place-items:center;color:var(--text-1);font-family:var(--font-display);gap:14px;opacity:0;transition:opacity 300ms var(--ease-out);",
    }, [
      el("i", { class: "fa-solid fa-circle-notch fa-spin", style: "font-size:34px;color:var(--accent);" }),
      el("div", { style: "font-size:15px;color:var(--text-2);" }, kind === "restart" ? "Restarting Aurora OS…" : "Shutting down…"),
    ]);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => (overlay.style.opacity = "1"));
    setTimeout(() => {
      if (kind === "restart") location.reload();
      else overlay.querySelector("div").textContent = "It is now safe to close Aurora OS.";
    }, 1400);
  }
}

/* ------------------ Init ------------------ */
export function initStartMenu() {
  scrim = el("div", { class: "start-scrim", onclick: (e) => { if (e.target === scrim) closeStart(); } });

  menu = el("div", { class: "start-menu", role: "dialog", "aria-label": "Start Menu" });
  scrim.appendChild(menu);

  // Search bar
  input = el("input", { type: "text", placeholder: "Search apps…", "aria-label": "Search apps", oninput: render });
  const searchBar = el("div", { class: "start-search" }, [
    el("i", { class: "fa-solid fa-magnifying-glass" }),
    input,
    el("kbd", {}, "Esc"),
  ]);

  // Body
  sectionLabel = el("div", { class: "start-section-label" }, "Pinned");
  grid = el("div", { class: "start-grid" });
  empty = el("div", { class: "start-empty", hidden: true }, [
    el("i", { class: "fa-solid fa-magnifying-glass" }),
    "No apps match your search.",
  ]);
  recentsWrap = el("div", { class: "start-recents-wrap", hidden: true });

  const body = el("div", { class: "start-body" }, [
    el("div", {}, [sectionLabel, grid, empty]),
    recentsWrap,
  ]);

  // Footer: user + power
  const footer = el("div", { class: "start-footer" }, [
    el("button", { class: "start-user", onclick: () => { launch("settings"); } }, [
      el("div", { class: "start-avatar" }, "A"),
      el("div", { class: "u-meta" }, [
        el("div", { class: "u-name" }, "Aurora"),
        el("div", { class: "u-role" }, "Local account"),
      ]),
    ]),
    el("div", { class: "start-power" }, [
      powerBtn("fa-moon", "Toggle theme", "theme"),
      powerBtn("fa-lock", "Lock", "lock"),
      powerBtn("fa-bed", "Sleep", "sleep"),
      powerBtn("fa-arrows-rotate", "Restart", "restart"),
      powerBtn("fa-power-off", "Shut down", "shutdown", true),
    ]),
  ]);

  menu.append(searchBar, body, footer);
  document.body.appendChild(scrim);

  // Wire events
  on("start:toggle", toggleStartMenu);
  document.addEventListener("keydown", (e) => {
    // Global shortcut: Meta / Ctrl + Space opens the menu
    if ((e.metaKey || e.ctrlKey) && e.code === "Space") {
      e.preventDefault();
      toggleStartMenu();
      return;
    }
    onKeydown(e);
  });
}

function powerBtn(icon, label, kind, danger) {
  return el("button", {
    class: `power-btn${danger ? " danger" : ""}`,
    "aria-label": label,
    title: label,
    onclick: () => powerAction(kind),
  }, [el("i", { class: `fa-solid ${icon}` })]);
}