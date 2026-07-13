/* =================================================================
 * WINDOW MANAGER : create, focus (z-index), drag, resize,
 *                  snap (halves + maximize), minimize / maximize /
 *                  restore, animated open / close.
 * ================================================================= */
import { $, el, clamp, emit, on } from "./utils.js";
import { appMeta, placeholderBody } from "./apps.js";

const desktop = $("#desktop");
const MIN_W = 320;
const MIN_H = 200;
const DOCK_RESERVE = 96;   // space reserved for the dock at the bottom
const SNAP_EDGE = 26;      // px from a screen edge that triggers a snap

let zCounter = 100;
let snapPreview = null;
const windows = new Map();   // id -> record

/* ---------------- Workspace bounds (excludes dock) ---------------- */
function workspace() {
  return { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight - DOCK_RESERVE };
}

/* ---------------- Snap preview overlay ---------------- */
function ensurePreview() {
  if (!snapPreview) {
    snapPreview = el("div", { class: "snap-preview" });
    document.body.appendChild(snapPreview);
  }
  return snapPreview;
}
function showPreview(rect) {
  const p = ensurePreview();
  Object.assign(p.style, {
    left: `${rect.x}px`, top: `${rect.y}px`,
    width: `${rect.w}px`, height: `${rect.h}px`,
  });
  p.classList.add("show");
}
function hidePreview() { snapPreview?.classList.remove("show"); }

/* Which snap region is the pointer in? Returns a target rect or null. */
function snapRegion(px, py) {
  const ws = workspace();
  if (py <= ws.y + SNAP_EDGE) return { kind: "max", ...ws };
  if (px <= ws.x + SNAP_EDGE) return { kind: "left", x: ws.x, y: ws.y, w: ws.w / 2, h: ws.h };
  if (px >= ws.x + ws.w - SNAP_EDGE) return { kind: "right", x: ws.x + ws.w / 2, y: ws.y, w: ws.w / 2, h: ws.h };
  return null;
}

/* ---------------- Focus / z-index ---------------- */
function focusWindow(rec) {
  windows.forEach((r) => r.node.classList.remove("focused"));
  rec.node.classList.add("focused");
  rec.node.style.zIndex = ++zCounter;
}

/* ---------------- Geometry helpers ---------------- */
function applyRect(rec, r) {
  rec.node.style.left = `${r.x}px`;
  rec.node.style.top = `${r.y}px`;
  rec.node.style.width = `${r.w}px`;
  rec.node.style.height = `${r.h}px`;
  rec.rect = { ...r };
}

/* ---------------- Public : open or focus an app window ---------------- */
export function openWindow({ app, name, body }) {
  // One window per app id — focus / restore if it already exists.
  const existing = windows.get(app);
  if (existing) {
    if (existing.minimized) restoreWindow(existing);
    focusWindow(existing);
    return existing;
  }

  const meta = appMeta(app);
  const title = name || meta.title;
  const ws = workspace();

  const node = el("div", { class: "window glass opening", dataset: { app } }, [
    el("div", { class: "window-titlebar" }, [
      el("div", { class: "window-title" }, [
        el("i", { class: `fa-solid ${meta.icon}` }),
        el("span", {}, title),
      ]),
      el("div", { class: "window-controls" }, [
        winBtn("min", "fa-minus"),
        winBtn("max", "fa-expand"),
        winBtn("close", "fa-xmark"),
      ]),
    ]),
    el("div", { class: "window-body" }, [body || placeholderBody(app, title)]),
    ...["n", "s", "e", "w", "ne", "nw", "se", "sw"].map((dir) =>
      el("div", { class: `win-resize ${dir}`, dataset: { dir } })),
  ]);

  // Cascade initial placement, centred-ish and clamped into the workspace.
  const w = Math.min(meta.w, ws.w - 40);
  const h = Math.min(meta.h, ws.h - 40);
  const offset = (windows.size % 6) * 28;
  const x = clamp(ws.w / 2 - w / 2 + offset, ws.x + 8, ws.x + ws.w - w - 8);
  const y = clamp(ws.h / 2 - h / 2 + offset - 20, ws.y + 8, ws.y + ws.h - h - 8);

  const rec = { app, node, rect: { x, y, w, h }, prev: null, minimized: false, maximized: false };
  windows.set(app, rec);
  desktop.appendChild(node);
  applyRect(rec, rec.rect);
  focusWindow(rec);
  node.addEventListener("animationend", () => node.classList.remove("opening"), { once: true });

  wireControls(rec);
  wireDrag(rec);
  wireResize(rec);
  node.addEventListener("pointerdown", () => focusWindow(rec));

  emit("window:open", { app });
  return rec;
}

function winBtn(kind, icon) {
  return el("button", { class: `win-btn ${kind}`, "aria-label": kind }, [
    el("i", { class: `fa-solid ${icon}` }),
  ]);
}

/* ---------------- Controls : close / min / max ---------------- */
function wireControls(rec) {
  const { node } = rec;
  node.querySelector(".win-btn.close").addEventListener("click", (e) => { e.stopPropagation(); closeWindow(rec); });
  node.querySelector(".win-btn.min").addEventListener("click", (e) => { e.stopPropagation(); minimizeWindow(rec); });
  node.querySelector(".win-btn.max").addEventListener("click", (e) => { e.stopPropagation(); toggleMaximize(rec); });
  // Double-click titlebar toggles maximize
  node.querySelector(".window-titlebar").addEventListener("dblclick", () => toggleMaximize(rec));
}

export function closeWindow(rec) {
  rec.node.classList.add("closing");
  rec.node.addEventListener("animationend", () => {
    rec.node.remove();
    windows.delete(rec.app);
    emit("window:closed", { app: rec.app });
  }, { once: true });
}

export function minimizeWindow(rec) {
  if (rec.minimized) return;
  rec.minimized = true;
  rec.node.classList.add("minimizing");
  rec.node.addEventListener("animationend", () => {
    rec.node.classList.remove("minimizing");
    rec.node.style.display = "none";
  }, { once: true });
  emit("window:minimized", { app: rec.app });
}

export function restoreWindow(rec) {
  rec.minimized = false;
  rec.node.style.display = "";
  rec.node.classList.add("opening");
  rec.node.addEventListener("animationend", () => rec.node.classList.remove("opening"), { once: true });
  emit("window:restored", { app: rec.app });
}

export function toggleMaximize(rec) {
  const { node } = rec;
  node.classList.add("snapping");
  if (rec.maximized) {
    rec.maximized = false;
    node.classList.remove("maximized");
    applyRect(rec, rec.prev || rec.rect);
    node.querySelector(".win-btn.max i").className = "fa-solid fa-expand";
  } else {
    rec.prev = { ...rec.rect };
    rec.maximized = true;
    node.classList.add("maximized");
    applyRect(rec, workspace());
    node.querySelector(".win-btn.max i").className = "fa-solid fa-compress";
  }
  setTimeout(() => node.classList.remove("snapping"), 300);
}

/* ---------------- Dragging + snap ---------------- */
function wireDrag(rec) {
  const bar = rec.node.querySelector(".window-titlebar");
  let sx, sy, ox, oy, region = null, dragging = false;

  bar.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.target.closest(".win-btn")) return;
    dragging = true;
    focusWindow(rec);
    // If maximized, un-maximize under the cursor before dragging.
    if (rec.maximized) {
      const ratio = (e.clientX - rec.rect.x) / rec.rect.w;
      toggleMaximize(rec);
      rec.rect.x = clamp(e.clientX - rec.rect.w * ratio, 0, window.innerWidth - rec.rect.w);
      applyRect(rec, rec.rect);
    }
    sx = e.clientX; sy = e.clientY; ox = rec.rect.x; oy = rec.rect.y;
    rec.node.classList.add("dragging");
    bar.setPointerCapture(e.pointerId);
  });

  bar.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const ws = workspace();
    rec.rect.x = clamp(ox + e.clientX - sx, -rec.rect.w + 80, window.innerWidth - 80);
    rec.rect.y = clamp(oy + e.clientY - sy, 0, ws.h - 40);
    rec.node.style.left = `${rec.rect.x}px`;
    rec.node.style.top = `${rec.rect.y}px`;

    region = snapRegion(e.clientX, e.clientY);
    if (region) showPreview(region); else hidePreview();
  });

  bar.addEventListener("pointerup", (e) => {
    if (!dragging) return;
    dragging = false;
    rec.node.classList.remove("dragging");
    bar.releasePointerCapture?.(e.pointerId);
    hidePreview();
    if (region) {
      rec.prev = region.kind === "max" ? { ...rec.rect } : null;
      rec.node.classList.add("snapping");
      if (region.kind === "max") {
        rec.maximized = true;
        rec.node.classList.add("maximized");
        rec.node.querySelector(".win-btn.max i").className = "fa-solid fa-compress";
        applyRect(rec, workspace());
      } else {
        applyRect(rec, { x: region.x, y: region.y, w: region.w, h: region.h });
      }
      setTimeout(() => rec.node.classList.remove("snapping"), 300);
      region = null;
    }
  });
}

/* ---------------- Resizing (8 handles) ---------------- */
function wireResize(rec) {
  rec.node.querySelectorAll(".win-resize").forEach((handle) => {
    const dir = handle.dataset.dir;
    let sx, sy, start;

    handle.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      focusWindow(rec);
      sx = e.clientX; sy = e.clientY; start = { ...rec.rect };
      rec.node.classList.add("resizing");
      handle.setPointerCapture(e.pointerId);
    });

    handle.addEventListener("pointermove", (e) => {
      if (!rec.node.hasPointerCapture?.(e.pointerId)) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      const ws = workspace();
      let { x, y, w, h } = start;

      if (dir.includes("e")) w = clamp(start.w + dx, MIN_W, ws.w - start.x);
      if (dir.includes("s")) h = clamp(start.h + dy, MIN_H, ws.h - start.y);
      if (dir.includes("w")) {
        w = clamp(start.w - dx, MIN_W, start.x + start.w);
        x = start.x + start.w - w;
      }
      if (dir.includes("n")) {
        h = clamp(start.h - dy, MIN_H, start.y + start.h);
        y = start.y + start.h - h;
      }
      applyRect(rec, { x, y, w, h });
    });

    handle.addEventListener("pointerup", (e) => {
      rec.node.classList.remove("resizing");
      handle.releasePointerCapture?.(e.pointerId);
    });
  });
}

/* ---------------- Boot : listen for launch requests ---------------- */
export function initWindows() {
  on("app:launch", (e) => {
    const { app, name } = e.detail || {};
    if (!app || app === "start") return;
    openWindow({ app, name });
  });

  // Keep windows inside the viewport when it shrinks.
  window.addEventListener("resize", () => {
    const ws = workspace();
    windows.forEach((rec) => {
      if (rec.maximized) { applyRect(rec, ws); return; }
      rec.rect.w = Math.min(rec.rect.w, ws.w);
      rec.rect.h = Math.min(rec.rect.h, ws.h);
      rec.rect.x = clamp(rec.rect.x, -rec.rect.w + 80, ws.w - 80);
      rec.rect.y = clamp(rec.rect.y, 0, ws.h - 40);
      applyRect(rec, rec.rect);
    });
  });
}

/* Query helpers for the dock. */
export function getWindow(app) { return windows.get(app); }
export function isMinimized(app) { return !!windows.get(app)?.minimized; }
