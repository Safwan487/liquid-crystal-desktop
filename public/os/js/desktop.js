/* =================================================================
 * DESKTOP : icon model, rendering, selection, drag + grid snap,
 *           rename, delete, create folder, context menus, refresh
 * ================================================================= */
import { $, $$, el, store, snap, clamp, emit } from "./utils.js";
import { openMenu, closeMenu } from "./contextmenu.js";
import { toggleTheme } from "./theme.js";
import { notify } from "./notifications.js";

const GRID = 112;          // grid cell size for snapping
const MARGIN = 28;         // top/left offset for the grid
const layer = $("#icon-layer");
const desktop = $("#desktop");
const marquee = $("#marquee");

/* Default desktop set (icons that also map to apps come in later phases). */
const DEFAULTS = [
  { id: "files", name: "Files", icon: "fa-folder-open", app: "files", kind: "app" },
  { id: "browser", name: "Browser", icon: "fa-compass", app: "browser", kind: "app" },
  { id: "notepad", name: "Notepad", icon: "fa-pen-to-square", app: "notepad", kind: "app" },
  { id: "gallery", name: "Gallery", icon: "fa-image", app: "gallery", kind: "app" },
  { id: "terminal", name: "Terminal", icon: "fa-terminal", app: "terminal", kind: "app" },
  { id: "settings", name: "Settings", icon: "fa-gear", app: "settings", kind: "app" },
];

let icons = [];

/* ---------------- Persistence ---------------- */
function load() {
  icons = store.get("desktop-icons", null);
  if (!icons) {
    icons = DEFAULTS.map((d, i) => ({
      ...d,
      x: MARGIN,
      y: MARGIN + i * GRID,
    }));
    save();
  }
}
function save() { store.set("desktop-icons", icons); }

/* ---------------- Rendering ---------------- */
function render() {
  layer.innerHTML = "";
  for (const data of icons) layer.append(buildIcon(data));
}

function buildIcon(data) {
  const node = el("div", {
    class: "desktop-icon",
    tabindex: "0",
    dataset: { id: data.id, kind: data.kind },
  }, [
    el("div", { class: "icon-glyph" }, [el("i", { class: `fa-solid ${data.icon}` })]),
    el("div", { class: "icon-label" }, data.name),
  ]);
  node.style.left = `${data.x}px`;
  node.style.top = `${data.y}px`;

  attachIconBehaviour(node, data);
  return node;
}

/* ---------------- Selection ---------------- */
function clearSelection() { $$(".desktop-icon.selected").forEach((n) => n.classList.remove("selected")); }
function selected() { return $$(".desktop-icon.selected"); }

/* ---------------- Icon behaviour (select, drag, open) ---------------- */
function attachIconBehaviour(node, data) {
  let downX = 0, downY = 0, startX = 0, startY = 0, moved = false, dragging = false;

  node.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    if (!e.shiftKey && !node.classList.contains("selected")) clearSelection();
    node.classList.add("selected");
    downX = e.clientX; downY = e.clientY;
    startX = data.x; startY = data.y;
    moved = false; dragging = false;
    node.setPointerCapture(e.pointerId);
  });

  node.addEventListener("pointermove", (e) => {
    if (!node.hasPointerCapture?.(e.pointerId)) return;
    const dx = e.clientX - downX, dy = e.clientY - downY;
    if (!dragging && Math.hypot(dx, dy) < 5) return;
    dragging = true; moved = true;
    node.classList.add("dragging");
    data.x = clamp(startX + dx, 0, desktop.clientWidth - node.offsetWidth);
    data.y = clamp(startY + dy, 0, desktop.clientHeight - node.offsetHeight);
    node.style.left = `${data.x}px`;
    node.style.top = `${data.y}px`;
  });

  node.addEventListener("pointerup", (e) => {
    if (dragging) {
      // Grid snap on release
      data.x = clamp(snap(data.x - MARGIN, GRID) + MARGIN, 0, desktop.clientWidth - node.offsetWidth);
      data.y = clamp(snap(data.y - MARGIN, GRID) + MARGIN, 0, desktop.clientHeight - node.offsetHeight);
      node.style.left = `${data.x}px`;
      node.style.top = `${data.y}px`;
      node.classList.remove("dragging");
      save();
    }
    node.releasePointerCapture?.(e.pointerId);
  });

  node.addEventListener("dblclick", () => openIcon(data));
  node.addEventListener("keydown", (e) => {
    if (e.key === "Enter") openIcon(data);
    if (e.key === "F2") startRename(node, data);
    if (e.key === "Delete") removeIcon(data.id);
  });

  // Icon right-click menu
  node.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearSelection();
    node.classList.add("selected");
    openMenu(e.clientX, e.clientY, [
      { label: "Open", icon: "fa-arrow-up-right-from-square", onClick: () => openIcon(data) },
      { label: "Rename", icon: "fa-i-cursor", onClick: () => startRename(node, data) },
      { type: "sep" },
      { label: "Delete", icon: "fa-trash", danger: true, onClick: () => removeIcon(data.id) },
    ]);
  });
}

/** Open an icon — real windows arrive in Phase 2; announce for now. */
function openIcon(data) {
  emit("app:launch", { app: data.app, id: data.id, name: data.name });
  if (data.kind === "folder") {
    notify(data.name, "Folder opening arrives with the window manager.", "info");
  } else {
    notify(data.name, "Launching… (window manager lands in Phase 2)", "info");
  }
}

/* ---------------- Rename ---------------- */
function startRename(node, data) {
  const label = $(".icon-label", node);
  const input = el("input", { class: "icon-rename", value: data.name });
  label.replaceWith(input);
  input.focus();
  input.select();

  const commit = () => {
    const name = input.value.trim() || data.name;
    data.name = name;
    save();
    input.replaceWith(el("div", { class: "icon-label" }, name));
  };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") input.blur();
    if (e.key === "Escape") { input.value = data.name; input.blur(); }
  });
  input.addEventListener("blur", commit, { once: true });
}

/* ---------------- Delete ---------------- */
function removeIcon(id) {
  icons = icons.filter((i) => i.id !== id);
  save();
  render();
  notify("Deleted", "Item removed from desktop.", "success");
}

/* ---------------- Create folder ---------------- */
function createFolder(x, y) {
  const id = `folder-${Date.now()}`;
  const gx = clamp(snap(x - MARGIN, GRID) + MARGIN, 0, desktop.clientWidth - 96);
  const gy = clamp(snap(y - MARGIN, GRID) + MARGIN, 0, desktop.clientHeight - 110);
  icons.push({ id, name: "New Folder", icon: "fa-folder", app: "files", kind: "folder", x: gx, y: gy });
  save();
  render();
  const node = layer.querySelector(`[data-id="${id}"]`);
  const data = icons.find((i) => i.id === id);
  if (node && data) startRename(node, data);
}

/* ---------------- Marquee selection ---------------- */
function initMarquee() {
  let sx = 0, sy = 0, active = false;

  desktop.addEventListener("pointerdown", (e) => {
    if (e.target !== desktop && e.target !== layer) return;
    if (e.button !== 0) return;
    active = true; sx = e.clientX; sy = e.clientY;
    clearSelection();
    marquee.hidden = false;
    updateMarquee(sx, sy, sx, sy);
  });

  window.addEventListener("pointermove", (e) => {
    if (!active) return;
    updateMarquee(sx, sy, e.clientX, e.clientY);
    const box = marquee.getBoundingClientRect();
    $$(".desktop-icon").forEach((n) => {
      const r = n.getBoundingClientRect();
      const hit = !(r.right < box.left || r.left > box.right || r.bottom < box.top || r.top > box.bottom);
      n.classList.toggle("selected", hit);
    });
  });

  window.addEventListener("pointerup", () => { active = false; marquee.hidden = true; });
}

function updateMarquee(x1, y1, x2, y2) {
  const l = Math.min(x1, x2), t = Math.min(y1, y2);
  marquee.style.left = `${l}px`;
  marquee.style.top = `${t}px`;
  marquee.style.width = `${Math.abs(x2 - x1)}px`;
  marquee.style.height = `${Math.abs(y2 - y1)}px`;
}

/* ---------------- Desktop context menu ---------------- */
function initDesktopMenu() {
  desktop.addEventListener("contextmenu", (e) => {
    if (e.target !== desktop && e.target !== layer) return;
    e.preventDefault();
    clearSelection();
    openMenu(e.clientX, e.clientY, [
      { label: "New Folder", icon: "fa-folder-plus", onClick: () => createFolder(e.clientX, e.clientY) },
      { label: "Refresh", icon: "fa-rotate", onClick: refresh },
      { type: "sep" },
      { label: "Toggle Theme", icon: "fa-circle-half-stroke", onClick: toggleTheme },
      { type: "label", label: "Accent" },
      { type: "accents" },
      { type: "sep" },
      { label: "Reset Desktop", icon: "fa-arrows-rotate", danger: true, onClick: resetDesktop },
    ]);
  });

  desktop.addEventListener("pointerdown", (e) => {
    if (e.target === desktop || e.target === layer) closeMenu();
  });
}

/* ---------------- Refresh / reset ---------------- */
function refresh() {
  layer.style.animation = "none";
  render();
  requestAnimationFrame(() => { layer.style.animation = ""; });
  notify("Desktop refreshed", "", "success", 1600);
}

function resetDesktop() {
  store.set("desktop-icons", null);
  load();
  render();
  notify("Desktop reset", "Icons restored to defaults.", "info");
}

/* ---------------- Public boot ---------------- */
export function initDesktop() {
  load();
  render();
  initMarquee();
  initDesktopMenu();

  // Re-clamp icons into view on resize (responsive safety)
  window.addEventListener("resize", () => {
    let changed = false;
    for (const d of icons) {
      const nx = clamp(d.x, 0, desktop.clientWidth - 96);
      const ny = clamp(d.y, 0, desktop.clientHeight - 110);
      if (nx !== d.x || ny !== d.y) { d.x = nx; d.y = ny; changed = true; }
    }
    if (changed) { save(); render(); }
  });
}