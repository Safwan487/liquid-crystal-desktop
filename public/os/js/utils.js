/* =================================================================
 * UTILS : small reusable helpers shared across modules
 * ================================================================= */

/** querySelector shorthand */
export const $ = (sel, root = document) => root.querySelector(sel);
/** querySelectorAll -> array */
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Create an element with props + children in one call. */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k === "dataset") Object.assign(node.dataset, v);
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.append(c.nodeType ? c : document.createTextNode(c));
  }
  return node;
}

/** Clamp a number between min and max. */
export const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

/** Snap a value to the nearest grid step. */
export const snap = (n, step) => Math.round(n / step) * step;

/** Persisted state helper backed by localStorage (JSON). */
export const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(`aurora:${key}`);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`aurora:${key}`, JSON.stringify(value));
    } catch { /* quota / private mode */ }
  },
};

/** Tiny event bus so modules can talk without hard coupling. */
export const bus = new EventTarget();
export const emit = (type, detail) => bus.dispatchEvent(new CustomEvent(type, { detail }));
export const on = (type, cb) => bus.addEventListener(type, cb);

/** Material-style ripple on click. */
export function ripple(event, host = event.currentTarget) {
  const rect = host.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const r = document.createElement("span");
  r.className = "ripple";
  r.style.width = r.style.height = `${size}px`;
  r.style.left = `${event.clientX - rect.left - size / 2}px`;
  r.style.top = `${event.clientY - rect.top - size / 2}px`;
  host.style.position ||= "relative";
  host.style.overflow = "hidden";
  host.appendChild(r);
  r.addEventListener("animationend", () => r.remove());
}