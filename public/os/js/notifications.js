/* =================================================================
 * NOTIFICATIONS : transient glass toasts + persistent history
 * that feeds the Notification Center panel.
 * ================================================================= */
import { $, el, emit, store } from "./utils.js";

const ICONS = {
  info: "fa-circle-info",
  success: "fa-circle-check",
  warning: "fa-triangle-exclamation",
  error: "fa-circle-xmark",
};

const MAX_HISTORY = 30;
let history = [];

/** Restore persisted history (called by main). */
export function initNotifications() {
  history = store.get("notifications", []).slice(0, MAX_HISTORY);
  emit("notifications:change", { history });
}

export function getNotifications() { return history.slice(); }
export function clearNotifications() {
  history = [];
  store.set("notifications", history);
  emit("notifications:change", { history });
}
export function dismissNotification(id) {
  history = history.filter((n) => n.id !== id);
  store.set("notifications", history);
  emit("notifications:change", { history });
}

/**
 * Show a glass toast notification.
 * @param {string} title
 * @param {string} msg
 * @param {"info"|"success"|"warning"|"error"} type
 * @param {number} ttl auto-dismiss ms
 */
export function notify(title, msg = "", type = "info", ttl = 3600) {
  const stack = $("#toast-stack");
  // Record in history even if the stack is not mounted yet.
  const entry = { id: Date.now() + Math.random(), title, msg, type, ts: Date.now() };
  history = [entry, ...history].slice(0, MAX_HISTORY);
  store.set("notifications", history);
  emit("notifications:change", { history, added: entry });
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