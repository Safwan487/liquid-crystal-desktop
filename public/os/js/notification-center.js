/* =================================================================
 * NOTIFICATION CENTER : slide-in panel with quick toggles + history.
 * Opens from the tray "center" button or via bus "center:toggle".
 * ================================================================= */
import { $, el, on, emit, store, ripple } from "./utils.js";
import { toggleTheme, getTheme, ACCENTS, setAccent, getAccent } from "./theme.js";
import {
  getNotifications, clearNotifications, dismissNotification,
} from "./notifications.js";

let scrim, panel, listEl, wifiTile, btTile, dndTile, themeTile, volSlider, volVal, brSlider, brVal;
let open = false;

/* ------------- Quick-toggle state (local) ------------- */
const state = {
  wifi: store.get("nc.wifi", true),
  bluetooth: store.get("nc.bt", false),
  dnd: store.get("nc.dnd", false),
  volume: store.get("nc.vol", 65),
  brightness: store.get("nc.br", 85),
};
function persist() {
  store.set("nc.wifi", state.wifi);
  store.set("nc.bt", state.bluetooth);
  store.set("nc.dnd", state.dnd);
  store.set("nc.vol", state.volume);
  store.set("nc.br", state.brightness);
}

/* ------------- Helpers ------------- */
function timeAgo(ts) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return `${d}d ago`;
}
const ICONS = {
  info: "fa-circle-info", success: "fa-circle-check",
  warning: "fa-triangle-exclamation", error: "fa-circle-xmark",
};

/* ------------- Rendering ------------- */
function renderList() {
  const items = getNotifications();
  listEl.innerHTML = "";
  if (!items.length) {
    listEl.appendChild(el("div", { class: "nc-empty" }, [
      el("i", { class: "fa-regular fa-bell-slash" }),
      el("div", {}, "You're all caught up."),
    ]));
    return;
  }
  items.forEach((n) => {
    const node = el("div", { class: `nc-item ${n.type || "info"}` }, [
      el("div", { class: "nc-ic" }, [el("i", { class: `fa-solid ${ICONS[n.type] || ICONS.info}` })]),
      el("div", { class: "nc-body" }, [
        el("div", { class: "nc-h" }, [
          el("div", { class: "nc-t" }, n.title),
          el("div", { class: "nc-time" }, timeAgo(n.ts)),
        ]),
        n.msg ? el("div", { class: "nc-m" }, n.msg) : null,
      ]),
    ]);
    node.addEventListener("click", () => dismissNotification(n.id));
    listEl.appendChild(node);
  });
}

function syncToggles() {
  wifiTile.classList.toggle("on", state.wifi);
  btTile.classList.toggle("on", state.bluetooth);
  dndTile.classList.toggle("on", state.dnd);
  themeTile.classList.toggle("on", getTheme() === "dark");
  themeTile.querySelector("span").textContent = getTheme() === "dark" ? "Dark" : "Light";
  themeTile.querySelector("i").className = `fa-solid ${getTheme() === "dark" ? "fa-moon" : "fa-sun"}`;
  volSlider.value = state.volume; volVal.textContent = state.volume;
  brSlider.value = state.brightness; brVal.textContent = state.brightness;
  // Reflect brightness as a soft wallpaper filter (visual polish)
  const wp = document.getElementById("wallpaper");
  if (wp) wp.style.filter = `brightness(${0.55 + (state.brightness / 100) * 0.55})`;
}

/* ------------- Open / close ------------- */
export function openCenter() {
  if (open) return;
  open = true;
  scrim.classList.add("open");
  $(`.tray-btn[data-tray="center"]`)?.classList.add("active");
  renderList();
  syncToggles();
}
export function closeCenter() {
  if (!open) return;
  open = false;
  scrim.classList.remove("open");
  $(`.tray-btn[data-tray="center"]`)?.classList.remove("active");
}
export function toggleCenter() { open ? closeCenter() : openCenter(); }

/* ------------- UI builders ------------- */
function quickTile(icon, label, kind, onClick) {
  const node = el("button", { class: "nc-tile", "data-kind": kind }, [
    el("i", { class: `fa-solid ${icon}` }),
    el("span", {}, label),
  ]);
  node.addEventListener("click", (e) => { ripple(e, node); onClick(node); });
  return node;
}

function accentRow() {
  const row = el("div", { class: "nc-quick", style: "grid-template-columns: repeat(6, 1fr); gap:6px; padding: 0 var(--sp-4) var(--sp-3);" });
  ACCENTS.forEach((a) => {
    const dot = el("button", {
      "aria-label": `Accent ${a}`,
      style: `height:22px; border-radius:999px; border:2px solid transparent; background: hsl(var(--accent-${a})); transition: transform var(--dur-fast) var(--ease-elastic);`,
    });
    dot.addEventListener("click", () => { setAccent(a); syncAccentDots(row); });
    dot.addEventListener("mouseenter", () => (dot.style.transform = "scale(1.1)"));
    dot.addEventListener("mouseleave", () => (dot.style.transform = "scale(1)"));
    dot.dataset.accent = a;
    row.appendChild(dot);
  });
  syncAccentDots(row);
  return row;
}
function syncAccentDots(row) {
  const cur = getAccent();
  row.querySelectorAll("[data-accent]").forEach((d) => {
    d.style.borderColor = d.dataset.accent === cur ? "var(--text-1)" : "transparent";
  });
}

/* ------------- Init ------------- */
export function initNotificationCenter() {
  scrim = el("div", { class: "nc-scrim", onclick: (e) => { if (e.target === scrim) closeCenter(); } });
  panel = el("div", { class: "nc-panel", role: "dialog", "aria-label": "Notification Center" });
  scrim.appendChild(panel);

  // Header
  const header = el("div", { class: "nc-header" }, [
    el("div", { class: "nc-title" }, "Control Center"),
    el("button", { class: "nc-clear", onclick: () => clearNotifications() }, "Clear all"),
  ]);

  // Quick tiles
  wifiTile = quickTile("fa-wifi", "Wi-Fi", "wifi", () => { state.wifi = !state.wifi; persist(); syncToggles(); });
  btTile   = quickTile("fa-bluetooth-b", "Bluetooth", "bt", () => { state.bluetooth = !state.bluetooth; persist(); syncToggles(); });
  dndTile  = quickTile("fa-moon", "Do Not Disturb", "dnd", () => { state.dnd = !state.dnd; persist(); syncToggles(); });
  themeTile = quickTile("fa-moon", "Dark", "theme", () => { toggleTheme(); syncToggles(); });
  const quick = el("div", { class: "nc-quick" }, [wifiTile, btTile, dndTile, themeTile]);

  // Accent row
  const accents = accentRow();

  // Sliders
  volSlider = el("input", { type: "range", min: "0", max: "100", value: state.volume });
  volSlider.addEventListener("input", () => {
    state.volume = +volSlider.value; volVal.textContent = state.volume; persist();
    emit("nc:volume", state.volume);
  });
  volVal = el("span", { class: "val" }, String(state.volume));
  const volRow = el("div", { class: "nc-slider" }, [
    el("i", { class: "fa-solid fa-volume-high" }), volSlider, volVal,
  ]);

  brSlider = el("input", { type: "range", min: "20", max: "100", value: state.brightness });
  brSlider.addEventListener("input", () => { state.brightness = +brSlider.value; brVal.textContent = state.brightness; persist(); syncToggles(); });
  brVal = el("span", { class: "val" }, String(state.brightness));
  const brRow = el("div", { class: "nc-slider" }, [
    el("i", { class: "fa-solid fa-sun" }), brSlider, brVal,
  ]);

  const sep = el("div", { class: "nc-sep" });

  // Notifications list
  const listLabel = el("div", { class: "nc-list-label" }, [
    el("span", {}, "Notifications"),
  ]);
  listEl = el("div", { class: "nc-list" });

  panel.append(header, quick, accents, volRow, brRow, sep, listLabel, listEl);
  document.body.appendChild(scrim);

  // Wire bus + external events
  on("center:toggle", toggleCenter);
  on("center:open", openCenter);
  on("notifications:change", () => { if (open) renderList(); });
  on("theme:change", () => { if (open) syncToggles(); });
  on("accent:change", () => syncAccentDots(accents));

  // Close on Escape when open
  document.addEventListener("keydown", (e) => {
    if (open && e.key === "Escape") { e.preventDefault(); closeCenter(); }
  });

  // Apply persisted brightness on boot
  syncToggles();
}