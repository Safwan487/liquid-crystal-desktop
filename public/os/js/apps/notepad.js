/* Notepad — autosaving text editor with word/char count. */
import { el, store, emit } from "../utils.js";

export function buildNotepad() {
  const root = el("div", { class: "app notepad-app" });
  const initial = store.get("notepad", "# Welcome to Aurora Notepad\n\nStart typing — your notes autosave.\n");
  const ta = el("textarea", { class: "np-area", spellcheck: "true" });
  ta.value = initial;

  const stat = el("div", { class: "np-stat" });
  const update = () => {
    const t = ta.value;
    const words = t.trim() ? t.trim().split(/\s+/).length : 0;
    stat.textContent = `${words} words · ${t.length} chars`;
  };
  let t;
  ta.addEventListener("input", () => { update(); clearTimeout(t); t = setTimeout(() => store.set("notepad", ta.value), 400); });

  const toolbar = el("div", { class: "np-toolbar" }, [
    el("button", { class: "np-btn", onclick: () => { ta.value = ""; update(); store.set("notepad",""); } }, [el("i",{class:"fa-solid fa-file"}), " New"]),
    el("button", { class: "np-btn", onclick: () => {
      const blob = new Blob([ta.value], { type: "text/plain" });
      const a = el("a", { href: URL.createObjectURL(blob), download: "note.txt" }); a.click();
    }}, [el("i",{class:"fa-solid fa-download"}), " Save"]),
    el("button", { class: "np-btn", onclick: () => { navigator.clipboard?.writeText(ta.value); emit("toast",{title:"Notepad",body:"Copied to clipboard"}); } }, [el("i",{class:"fa-solid fa-copy"}), " Copy"]),
    el("div", { class: "np-spacer" }),
    stat,
  ]);

  root.append(toolbar, ta);
  update();
  return root;
}