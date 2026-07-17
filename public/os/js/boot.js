/* =================================================================
 * BOOT SPLASH : brief Aurora OS intro overlay shown on cold load.
 * Fades away after ~1.4s or on any user gesture.
 * ================================================================= */
import { el } from "./utils.js";

export function initBoot() {
  // Only show once per session so hot-reloads don't feel sluggish.
  if (sessionStorage.getItem("aurora:booted")) return;
  sessionStorage.setItem("aurora:booted", "1");

  const splash = el("div", { class: "boot-splash", role: "status", "aria-label": "Booting Aurora OS" }, [
    el("div", { class: "boot-orb" }, [
      el("span", { class: "boot-ring" }),
      el("span", { class: "boot-ring boot-ring-2" }),
      el("i", { class: "fa-solid fa-meteor" }),
    ]),
    el("div", { class: "boot-title" }, "Aurora OS"),
    el("div", { class: "boot-sub" }, "Liquid Glass Desktop"),
    el("div", { class: "boot-bar" }, [el("span")]),
  ]);
  document.body.appendChild(splash);

  const dismiss = () => {
    splash.classList.add("leaving");
    splash.addEventListener("transitionend", () => splash.remove(), { once: true });
  };
  setTimeout(dismiss, 1400);
  splash.addEventListener("pointerdown", dismiss);
}