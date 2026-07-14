/* Settings — theme, accent, wallpaper, and about. */
import { el, store, emit } from "../utils.js";
import { setTheme, setAccent, getTheme, getAccent, ACCENTS } from "../theme.js";

const WALLPAPERS = ["aurora","nebula","prism","glacier","dune","ember"];

export function buildSettings() {
  const root = el("div", { class: "app settings-app" });

  const sections = [
    { id: "appearance", label: "Appearance", icon: "fa-palette" },
    { id: "wallpaper",  label: "Wallpaper",  icon: "fa-image" },
    { id: "system",     label: "System",     icon: "fa-microchip" },
    { id: "about",      label: "About",      icon: "fa-circle-info" },
  ];
  let active = "appearance";

  const nav = el("aside", { class: "st-nav" },
    sections.map(s => el("button", { class: "st-nav-btn", dataset: { id: s.id }, onclick: () => go(s.id) }, [
      el("i", { class: `fa-solid ${s.icon}` }), el("span", {}, s.label),
    ])));
  const pane = el("section", { class: "st-pane" });

  function swatchRow() {
    return el("div", { class: "st-swatches" },
      ACCENTS.map(a => el("button", { class: `st-swatch swatch ${a===getAccent()?"active":""}`, dataset: { accent: a }, onclick: () => { setAccent(a); render(); }, style: `--sw: var(--accent-${a})` })));
  }

  function renderPane() {
    pane.innerHTML = "";
    if (active === "appearance") {
      pane.append(
        el("h2", {}, "Appearance"),
        el("div", { class: "st-row" }, [
          el("div", {}, [el("div", { class: "st-lbl" }, "Theme"), el("div", { class: "st-sub" }, "Switch between light and dark surfaces")]),
          el("div", { class: "st-seg" }, ["dark","light"].map(t =>
            el("button", { class: `st-seg-btn ${getTheme()===t?"on":""}`, onclick: () => { setTheme(t); render(); } }, t))),
        ]),
        el("div", { class: "st-row" }, [
          el("div", {}, [el("div", { class: "st-lbl" }, "Accent color"), el("div", { class: "st-sub" }, "Applied across the entire desktop")]),
          swatchRow(),
        ]),
      );
    } else if (active === "wallpaper") {
      const cur = store.get("wallpaper", "aurora");
      pane.append(el("h2", {}, "Wallpaper"),
        el("div", { class: "st-walls" }, WALLPAPERS.map(w =>
          el("button", { class: `st-wall ${w===cur?"on":""}`, dataset: { w }, onclick: () => { store.set("wallpaper", w); document.documentElement.dataset.wallpaper = w; render(); } }, [
            el("div", { class: `st-wall-preview wp-${w}` }),
            el("span", {}, w),
          ]))));
    } else if (active === "system") {
      pane.append(el("h2", {}, "System"),
        el("div", { class: "st-row" }, [ el("div", {}, [el("div", { class: "st-lbl" }, "Reset desktop"), el("div", { class: "st-sub" }, "Clear all saved preferences")]),
          el("button", { class: "st-danger", onclick: () => { localStorage.clear(); emit("toast", { title: "System", body: "Preferences cleared — reloading" }); setTimeout(()=>location.reload(), 600); } }, "Reset"),
        ]));
    } else {
      pane.append(el("h2", {}, "About"),
        el("div", { class: "st-about" }, [
          el("div", { class: "st-logo" }, [el("i", { class: "fa-solid fa-meteor" })]),
          el("h3", {}, "Aurora OS"),
          el("p", {}, "A liquid-glass desktop environment built with vanilla JavaScript, HTML5, Tailwind, Google Fonts, and Font Awesome."),
          el("p", { class: "st-sub" }, "Version 1.0 — Phase 4"),
        ]));
    }
  }

  function go(id){ active = id; render(); }
  function render(){
    nav.querySelectorAll(".st-nav-btn").forEach(n => n.classList.toggle("on", n.dataset.id === active));
    renderPane();
  }

  root.append(nav, pane);
  render();
  return root;
}