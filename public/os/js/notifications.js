/* =================================================================
 * NOTIFICATIONS : transient glass toasts
 * ================================================================= */
import { $, el } from "./utils.js";

const ICONS = {
  info: "fa-circle-info",
  success: "fa-circle-check",
  warning: "fa-triangle-exclamation",
  error: "fa-circle-xmark",
};

/**
 * Show a glass toast notification.
 * @param {string} title
 * @param {string} msg
 * @param {"info"|"success"|"warning"|"error"} type
 * @param {number} ttl auto-dismiss ms
 */
export function notify(title, msg = "", type = "info", ttl = 3600) {
  const stack = $("#toast-stack");
  if (!stack) return;

  const toast = el("div", { class: "toast glass", role: "status" }, [
    el("div", { class: "toast-icon" }, [el("i", { class: `fa-solid ${ICONS[type] || ICONS.info}` })]),
    el("div", { class: "toast-body" }, [
      el("div", { class: "toast-title" }, title),
      msg ? el("div", { class: "toast-msg" }, msg) : null,
    ]),
  ]);

  stack.appendChild(toast);
  const remove = () => {
    toast.classList.add("leaving");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  };
  toast.addEventListener("click", remove);
  setTimeout(remove, ttl);
}