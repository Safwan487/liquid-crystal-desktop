/* Terminal — playful REPL. Not a real shell. */
import { el, emit } from "../utils.js";
import { setTheme, setAccent, ACCENTS } from "../theme.js";

const HELP = [
  "help              show this help",
  "ls [dir]          list files",
  "cat <file>        print file contents",
  "echo <text>       echo text",
  "date              show date/time",
  "whoami            print user",
  "open <app>        launch an app",
  "theme <light|dark>",
  "accent <"+ACCENTS.join("|")+">",
  "clear             clear the screen",
];
const FILES = { "readme.txt": "Welcome to Aurora OS — a liquid-glass desktop." };

export function buildTerminal() {
  const root = el("div", { class: "app term-app" });
  const out = el("div", { class: "term-out" });
  const input = el("input", { class: "term-input", spellcheck: "false", autocomplete: "off" });
  const prompt = el("span", { class: "term-prompt" }, "aurora ~ $");
  const line = el("div", { class: "term-line" }, [prompt, input]);

  const history = []; let hi = -1;
  const print = (t, cls="") => out.append(el("div", { class: `term-row ${cls}` }, t));

  print("Aurora Terminal v1.0 — type 'help' to begin.", "muted");

  function run(cmd) {
    print(`aurora ~ $ ${cmd}`, "echo");
    const [c, ...rest] = cmd.trim().split(/\s+/);
    const arg = rest.join(" ");
    switch (c) {
      case "": break;
      case "help": HELP.forEach(l => print(l)); break;
      case "ls": print(Object.keys(FILES).concat(["Documents/","Pictures/","Music/"]).join("   ")); break;
      case "cat": print(FILES[arg] || `cat: ${arg}: No such file`); break;
      case "echo": print(arg); break;
      case "date": print(new Date().toString()); break;
      case "whoami": print("aurora"); break;
      case "clear": out.innerHTML = ""; break;
      case "open":
        if (!arg) { print("usage: open <app>"); break; }
        emit("app:launch", { app: arg }); print(`launching ${arg}…`, "muted"); break;
      case "theme":
        if (!["light","dark"].includes(arg)) { print("usage: theme <light|dark>"); break; }
        setTheme(arg); print(`theme → ${arg}`, "muted"); break;
      case "accent":
        if (!ACCENTS.includes(arg)) { print("usage: accent <"+ACCENTS.join("|")+">"); break; }
        setAccent(arg); print(`accent → ${arg}`, "muted"); break;
      default: print(`${c}: command not found`, "err");
    }
    out.scrollTop = out.scrollHeight;
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { const v = input.value; if (v) history.unshift(v); hi = -1; input.value = ""; run(v); }
    else if (e.key === "ArrowUp") { if (hi < history.length-1) { hi++; input.value = history[hi]; } e.preventDefault(); }
    else if (e.key === "ArrowDown") { if (hi > 0) { hi--; input.value = history[hi]; } else { hi = -1; input.value = ""; } e.preventDefault(); }
  });
  root.addEventListener("click", () => input.focus());
  setTimeout(() => input.focus(), 50);

  root.append(out, line);
  return root;
}