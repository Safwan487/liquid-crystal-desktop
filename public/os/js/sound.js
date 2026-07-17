/* =================================================================
 * SOUND : lightweight synthesized UI audio using the WebAudio API.
 * No external files — every effect is composed from oscillators + a
 * short gain envelope, so the OS ships zero-audio-asset.
 *
 * Effects fire off the shared event bus so any module can trigger
 * them without importing this file directly:
 *   emit("sound:play", "open" | "close" | "min" | "click" | "toggle"
 *                     | "notify" | "error")
 * ================================================================= */
import { on, emit, store, $ } from "./utils.js";

let ctx = null;
let master = null;
let muted = store.get("sound.muted", false);
let volume = store.get("sound.vol", 0.35);

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : volume;
  master.connect(ctx.destination);
  return ctx;
}

function tone({ freq = 440, type = "sine", dur = 0.14, gain = 0.4, attack = 0.005, release = 0.08, slideTo = null, when = 0 }) {
  const c = ensureCtx(); if (!c) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + release + 0.02);
}

const RECIPES = {
  open:   () => { tone({ freq: 420, slideTo: 880, type: "sine", dur: 0.16, gain: 0.28 });
                  tone({ freq: 660, slideTo: 1320, type: "triangle", dur: 0.14, gain: 0.14, when: 0.02 }); },
  close:  () => { tone({ freq: 720, slideTo: 260, type: "sine", dur: 0.18, gain: 0.24 }); },
  min:    () => { tone({ freq: 540, slideTo: 220, type: "triangle", dur: 0.14, gain: 0.22 }); },
  click:  () => { tone({ freq: 1600, type: "square", dur: 0.02, gain: 0.06, release: 0.03 }); },
  toggle: () => { tone({ freq: 880, type: "triangle", dur: 0.05, gain: 0.16 });
                  tone({ freq: 1240, type: "triangle", dur: 0.06, gain: 0.12, when: 0.04 }); },
  notify: () => { tone({ freq: 880, type: "sine", dur: 0.10, gain: 0.22 });
                  tone({ freq: 1320, type: "sine", dur: 0.14, gain: 0.18, when: 0.10 }); },
  error:  () => { tone({ freq: 260, type: "sawtooth", dur: 0.12, gain: 0.22 });
                  tone({ freq: 200, type: "sawtooth", dur: 0.16, gain: 0.20, when: 0.10 }); },
};

export function playSound(name) {
  if (muted) return;
  const fn = RECIPES[name]; if (!fn) return;
  const c = ensureCtx(); if (!c) return;
  if (c.state === "suspended") c.resume();
  try { fn(); } catch { /* ignore audio glitches */ }
}

export function setMuted(v) {
  muted = !!v;
  store.set("sound.muted", muted);
  if (master) master.gain.value = muted ? 0 : volume;
  emit("sound:muted", { muted });
}
export function isMuted() { return muted; }
export function setVolume(v) {
  volume = Math.max(0, Math.min(1, v));
  store.set("sound.vol", volume);
  if (master && !muted) master.gain.value = volume;
}

/* ------------- Init ------------- */
export function initSound() {
  // Unlock the AudioContext on first user gesture (browser autoplay policy).
  const unlock = () => {
    const c = ensureCtx();
    if (c && c.state === "suspended") c.resume();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });

  // Bus events → sounds
  on("sound:play", (e) => playSound(e.detail));
  on("window:open",       () => playSound("open"));
  on("window:closed",     () => playSound("close"));
  on("window:minimized",  () => playSound("min"));
  on("window:restored",   () => playSound("open"));
  on("notifications:change", (e) => { if (e.detail?.added) playSound("notify"); });
  on("theme:change",  () => playSound("toggle"));
  on("accent:change", () => playSound("toggle"));

  // Delegated click sound for dock, tray, start menu tiles and NC tiles.
  document.addEventListener("pointerdown", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (t.closest(".dock-item, .tray-btn, .nc-tile, .sm-tile, .search-item, .power-btn")) {
      playSound("click");
    }
  }, true);

  // Sync volume from the Control Center slider if present.
  on("nc:volume", (e) => setVolume((e.detail ?? 35) / 100));
}

/** Expose a global helper for the console / debugging. */
if (typeof window !== "undefined") {
  window.AuroraSound = { play: playSound, setMuted, isMuted, setVolume };
}