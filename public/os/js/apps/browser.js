/* Browser — tabs + URL bar + sandboxed iframe with a curated start page. */
import { el } from "../utils.js";

const QUICK = [
  { name: "Wikipedia",  url: "https://en.wikipedia.org/wiki/Main_Page", icon: "fa-w" },
  { name: "MDN",        url: "https://developer.mozilla.org/",         icon: "fa-book" },
  { name: "Hacker News",url: "https://news.ycombinator.com/",          icon: "fa-hacker-news" },
  { name: "GitHub",     url: "https://github.com/",                    icon: "fa-github" },
  { name: "Unsplash",   url: "https://unsplash.com/",                  icon: "fa-image" },
  { name: "Lovable",    url: "https://lovable.dev/",                   icon: "fa-heart" },
];

export function buildBrowser() {
  const root = el("div", { class: "app browser-app" });
  const tabs = [{ title: "New Tab", url: "about:start" }];
  let active = 0;

  const tabsBar = el("div", { class: "br-tabs" });
  const urlInput = el("input", { class: "br-url", placeholder: "Search or enter URL", spellcheck: "false" });
  const frame = el("iframe", { class: "br-frame", sandbox: "allow-forms allow-scripts allow-same-origin allow-popups", referrerpolicy: "no-referrer" });
  const startPage = el("div", { class: "br-start" }, [
    el("h1", {}, "Aurora Browser"),
    el("p", {}, "Fast, private, glass-clean."),
    el("div", { class: "br-quick" },
      QUICK.map((q) => el("button", { class: "br-quick-item", onclick: () => nav(q.url) }, [
        el("i", { class: `fa-solid ${q.icon}` }),
        el("span", {}, q.name),
      ]))),
  ]);
  const stage = el("div", { class: "br-stage" }, [startPage, frame]);

  function normalize(v) {
    v = v.trim(); if (!v) return "about:start";
    if (v === "about:start") return v;
    if (/^https?:\/\//i.test(v)) return v;
    if (/^[\w-]+(\.[\w-]+)+/.test(v)) return "https://" + v;
    return "https://duckduckgo.com/?q=" + encodeURIComponent(v);
  }
  function nav(v) {
    const u = normalize(v);
    tabs[active].url = u;
    tabs[active].title = u === "about:start" ? "New Tab" : new URL(u).hostname;
    urlInput.value = u === "about:start" ? "" : u;
    if (u === "about:start") { startPage.style.display=""; frame.style.display="none"; frame.src="about:blank"; }
    else { startPage.style.display="none"; frame.style.display=""; frame.src = u; }
    renderTabs();
  }
  function renderTabs() {
    tabsBar.innerHTML = "";
    tabs.forEach((t, i) => {
      tabsBar.append(el("div", { class: `br-tab ${i===active?"active":""}`, onclick: () => { active = i; nav(t.url); } }, [
        el("span", {}, t.title),
        el("button", { class: "br-tab-x", onclick: (e) => { e.stopPropagation(); if (tabs.length===1) return; tabs.splice(i,1); active = Math.max(0, active-(i<=active?1:0)); nav(tabs[active].url); } }, "×"),
      ]));
    });
    tabsBar.append(el("button", { class: "br-tab-add", onclick: () => { tabs.push({title:"New Tab",url:"about:start"}); active = tabs.length-1; nav("about:start"); } }, "+"));
  }

  const toolbar = el("div", { class: "br-toolbar" }, [
    el("button", { class: "br-btn", onclick: () => history.back(), title: "Back" }, [el("i",{class:"fa-solid fa-arrow-left"})]),
    el("button", { class: "br-btn", onclick: () => frame.contentWindow?.location.reload(), title: "Reload" }, [el("i",{class:"fa-solid fa-rotate-right"})]),
    el("button", { class: "br-btn", onclick: () => nav("about:start"), title: "Home" }, [el("i",{class:"fa-solid fa-house"})]),
    urlInput,
    el("button", { class: "br-btn go", onclick: () => nav(urlInput.value), title: "Go" }, [el("i",{class:"fa-solid fa-arrow-right"})]),
  ]);
  urlInput.addEventListener("keydown", (e) => { if (e.key === "Enter") nav(urlInput.value); });

  root.append(tabsBar, toolbar, stage);
  renderTabs(); nav("about:start");
  return root;
}