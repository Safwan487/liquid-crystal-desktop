/* Calculator — basic arithmetic with keyboard support. */
import { el } from "../utils.js";

export function buildCalculator() {
  const root = el("div", { class: "app calc-app" });
  let expr = "0", justEvaluated = false;

  const display = el("div", { class: "calc-display" }, [
    el("div", { class: "calc-sub" }, ""),
    el("div", { class: "calc-main" }, expr),
  ]);

  const KEYS = [
    ["AC","op-fn"],["±","op-fn"],["%","op-fn"],["÷","op"],
    ["7"],["8"],["9"],["×","op"],
    ["4"],["5"],["6"],["−","op"],
    ["1"],["2"],["3"],["+","op"],
    ["0","wide"],["."],["=","op-eq"],
  ];

  const pad = el("div", { class: "calc-pad" });
  KEYS.forEach(([k, cls]) => {
    pad.append(el("button", { class: `calc-key ${cls||""}`, onclick: () => press(k) }, k));
  });

  function press(k) {
    if (k === "AC") { expr = "0"; }
    else if (k === "±") { expr = expr.startsWith("-") ? expr.slice(1) : "-"+expr; }
    else if (k === "%") { expr = String(parseFloat(expr)/100); }
    else if (k === "=") { compute(); return; }
    else if ("+−×÷".includes(k)) {
      if (/[+\-×÷]$/.test(expr)) expr = expr.slice(0,-1);
      expr += k; justEvaluated = false;
    } else {
      if (expr === "0" || justEvaluated) { expr = k === "." ? "0." : k; justEvaluated = false; }
      else expr += k;
    }
    render();
  }
  function compute() {
    try {
      const js = expr.replace(/×/g,"*").replace(/÷/g,"/").replace(/−/g,"-");
      // eslint-disable-next-line no-new-func
      const r = Function(`"use strict";return (${js})`)();
      display.firstChild.textContent = expr + " =";
      expr = String(+r.toFixed(10)); justEvaluated = true;
    } catch { expr = "Error"; }
    render();
  }
  function render() { display.lastChild.textContent = expr; }

  root.append(display, pad);
  root.tabIndex = 0;
  root.addEventListener("keydown", (e) => {
    const map = { "*":"×", "/":"÷", "-":"−", Enter:"=", "=":"=", Escape:"AC", Backspace:"BACK" };
    const k = map[e.key] || (/^[0-9.+%]$/.test(e.key) ? e.key : null);
    if (k === "BACK") { expr = expr.length>1 ? expr.slice(0,-1) : "0"; render(); }
    else if (k) press(k);
  });
  return root;
}