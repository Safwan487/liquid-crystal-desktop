/* =================================================================
 * SEARCH : global spotlight overlay.
 * Sources: apps, quick commands (theme/accent/lock), desktop files.
 * Shortcut: Ctrl/⌘ + K   |  tray "search" button   |  bus "search:toggle"
 * ================================================================= */
import { $, el, on, emit, store, ripple } from "./utils.js";
import { APPS } from "./apps.js";
import { openWindow } from "./window.js";
import { setTheme, setAccent, ACCENTS, toggleTheme } from "./theme.js";
import { notify } from "./notifications.js";

let scrim, panel, input, results, footerCount;
let open = false;
let items = [];      // flat list of currently-visible SearchItem
let activeIdx = 0;

/* ---------- SearchItem shape ----------
 * { id, group, title, sub, icon, hint, run() }
 */

/* ---------- Sources ---------- */
function sourceApps(q) {
  return Object.entries(APPS)
    .filter(([id, m]) => !q || id.includes(q) || m.title.toLowerCase().includes(q))
    .map(([id, m]) => ({
      id: `app:${id}`, group: "Applications",
      title: m.title, sub: "Application", icon: m.icon, hint: "Open",
      run: () => openWindow({ app: id, name: m.title }),
    }));
}

function sourceCommands(q) {
  const cmds = [
    { id: "cmd:theme",    title: "Toggle theme",  sub: "Switch light / dark", icon: "fa-circle-half-stroke", run: () => toggleTheme() },
    { id: "cmd:theme.d",  title: "Dark theme",    sub: "Apply dark appearance", icon: "fa-moon",  run: () => setTheme("dark") },
    { id: "cmd:theme.l",  title: "Light theme",   sub: "Apply light appearance", icon: "fa-sun",  run: () => setTheme("light") },
    { id: "cmd:lock",     title: "Lock workspace",sub: "Blur and lock", icon: "fa-lock", run: () => notify("Locked", "The workspace is locked.", "info", 2200) },
    { id: "cmd:sleep",    title: "Sleep",         sub: "Dim the display", icon: "fa-bed", run: () => sleepFx() },
    { id: "cmd:notifs",   title: "Notification Center", sub: "Open the panel", icon: "fa-bell", run: () => emit("center:open") },
    { id: "cmd:start",    title: "Start Menu",    sub: "Open the launcher", icon: "fa-meteor", run: () => emit("start:toggle") },
    ...ACCENTS.map((a) => ({
      id: `cmd:accent.${a}`, title: `Accent — ${a[0].toUpperCase()+a.slice(1)}`,
      sub: "Change highlight color", icon: "fa-palette", run: () => setAccent(a),
    })),
  ];
  return cmds
    .filter((c) => !q || c.title.toLowerCase().includes(q) || c.sub.toLowerCase().includes(q))
    .map((c) => ({ ...c, group: "Commands", hint: "Run" }));
}

function sourceFiles(q) {
  const icons = store.get("desktop-icons", []);
  return icons
    .filter((i) => !q || i.name.toLowerCase().includes(q))
    .slice(0, 8)
    .map((i) => ({
      id: `file:${i.id}`, group: "Files",
      title: i.name, sub: i.app === "folder" ? "Folder on desktop" : "Shortcut on desktop",
      icon: i.icon || "fa-file", hint: "Open",
      run: () => openWindow({ app: i.app || "files", name: i.name }),
    }));
}

function sleepFx() {
  document.body.style.transition = "opacity 400ms var(--ease-out)";
  document.body.style.opacity = "0.05";
  setTimeout(() => { document.body.style.opacity = "1"; notify("Woke up", "Welcome back.", "success", 1800); }, 900);
}

/* ---------- Rendering ---------- */
function render() {
  const q = (input.value || "").trim().toLowerCase();
  const apps = sourceApps(q);
  const cmds = sourceCommands(q);
  const files = sourceFiles(q);
  items = [...apps, ...cmds, ...files];
  activeIdx = 0;

  results.innerHTML = "";
  if (!items.length) {
    results.appendChild(el("div", { class: "search-empty" }, [
      el("i", { class: "fa-solid fa-magnifying-glass" }),
      el("div", {}, q ? `No matches for “${q}”` : "Start typing to search apps, commands, and files."),
    ]));
    footerCount.textContent = "0 results";
    return;
  }
  const groups = [
    ["Applications", apps],
    ["Commands", cmds],
    ["Files", files],
  ];
  let flatIdx = 0;
  groups.forEach(([label, arr]) => {
    if (!arr.length) return;
    results.appendChild(el("div", { class: "search-group-label" }, label));
    arr.forEach((it) => {
      const idx = flatIdx++;
      const node = el("button", {
        class: `search-item${idx === 0 ? " active" : ""}`,
        dataset: { idx: String(idx) },
        onclick: (e) => { ripple(e, node); runItem(it); },
        onmouseenter: () => setActive(idx),
      }, [
        el("div", { class: "s-glyph" }, [el("i", { class: `fa-solid ${it.icon}` })]),
        el("div", { class: "s-meta" }, [
          el("div", { class: "s-title" }, it.title),
          el("div", { class: "s-sub" }, it.sub),
        ]),
        el("div", { class: "s-hint" }, [it.hint || "Run", " ↵"]),
      ]);
      results.appendChild(node);
    });
  });
  footerCount.textContent = `${items.length} result${items.length === 1 ? "" : "s"}`;
}

function setActive(idx) {
  const nodes = results.querySelectorAll(".search-item");
  if (!nodes.length) return;
  activeIdx = (idx + nodes.length) % nodes.length;
  nodes.forEach((n, i) => n.classList.toggle("active", i === activeIdx));
  nodes[activeIdx].scrollIntoView({ block: "nearest" });
}

function runItem(it) {
  closeSearch();
  try { it.run(); } catch (err) { notify("Search", String(err?.message || err), "error"); }
}

/* ---------- Open / close ---------- */
export function openSearch() {
  if (open) return;
  open = true;
  scrim.classList.add("open");
  $(`.tray-btn[data-tray="search"]`)?.classList.add("active");
  requestAnimationFrame(() => { input.value = ""; render(); input.focus(); });
}
export function closeSearch() {
  if (!open) return;
  open = false;
  scrim.classList.remove("open");
  $(`.tray-btn[data-tray="search"]`)?.classList.remove("active");
}
export function toggleSearch() { open ? closeSearch() : openSearch(); }

/* ---------- Init ---------- */
export function initSearch() {
  scrim = el("div", { class: "search-scrim", onclick: (e) => { if (e.target === scrim) closeSearch(); } });
  panel = el("div", { class: "search-panel", role: "dialog", "aria-label": "Search" });
  scrim.appendChild(panel);

  input = el("input", {
    type: "text", placeholder: "Search apps, commands, files…",
    "aria-label": "Search", spellcheck: "false", autocomplete: "off",
    oninput: render,
  });
  const inputRow = el("div", { class: "search-input-row" }, [
    el("i", { class: "fa-solid fa-magnifying-glass" }),
    input,
    el("kbd", {}, "Esc"),
  ]);

  results = el("div", { class: "search-results" });

  footerCount = el("span", {}, "0 results");
  const footer = el("div", { class: "search-footer" }, [
    footerCount,
    el("div", { class: "hints" }, [
      el("span", {}, [el("kbd", {}, "↑↓"), "Navigate"]),
      el("span", {}, [el("kbd", {}, "↵"), "Run"]),
      el("span", {}, [el("kbd", {}, "Esc"), "Close"]),
    ]),
  ]);

  panel.append(inputRow, results, footer);
  document.body.appendChild(scrim);

  on("search:toggle", toggleSearch);
  on("search:open", openSearch);

  document.addEventListener("keydown", (e) => {
    // Global shortcut: Ctrl/⌘ + K
    if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      toggleSearch();
      return;
    }
    if (!open) return;
    if (e.key === "Escape") { e.preventDefault(); closeSearch(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive(activeIdx + 1); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); setActive(activeIdx - 1); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const it = items[activeIdx]; if (it) runItem(it);
    }
  });
}