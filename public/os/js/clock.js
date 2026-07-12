/* =================================================================
 * CLOCK : drives desktop widget + tray, ticks once per second
 * ================================================================= */
import { $ } from "./utils.js";

const pad = (n) => String(n).padStart(2, "0");

function tick() {
  const now = new Date();
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const longDate = now.toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });
  const shortDate = now.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  setText("#clock", time);
  setText("#date", longDate);
  setText("#tray-time", time);
  setText("#tray-date", shortDate);
}

function setText(sel, value) {
  const node = $(sel);
  if (node && node.textContent !== value) node.textContent = value;
}

export function initClock() {
  tick();
  // Align to the top of the next minute is overkill for demo — 1s cadence is fine.
  setInterval(tick, 1000);
}