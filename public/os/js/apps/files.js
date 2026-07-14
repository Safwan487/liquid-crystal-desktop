/* Files — sidebar + icon grid with breadcrumb and view toggle. */
import { el } from "../utils.js";
import { emit } from "../utils.js";

const FS = {
  Home:      [["Documents","folder"],["Pictures","folder"],["Music","folder"],["Downloads","folder"],["readme.txt","file-lines"]],
  Documents: [["Resume.pdf","file-pdf"],["Budget.xlsx","file-excel"],["Notes.md","file-lines"],["Project","folder"]],
  Pictures:  [["sunset.jpg","file-image"],["mountain.jpg","file-image"],["portrait.jpg","file-image"],["Screenshots","folder"]],
  Music:     [["Aurora.mp3","file-audio"],["Nebula.mp3","file-audio"],["Prism.mp3","file-audio"]],
  Downloads: [["installer.dmg","file-zipper"],["report.pdf","file-pdf"]],
  Project:   [["index.html","file-code"],["style.css","file-code"],["app.js","file-code"]],
  Screenshots:[["screen-01.png","file-image"],["screen-02.png","file-image"]],
  Trash:     [],
};

export function buildFiles() {
  const root = el("div", { class: "app files-app" });
  let path = ["Home"], view = "grid";

  const sidebar = el("aside", { class: "files-sidebar" }, [
    el("div", { class: "files-section" }, "Places"),
    ...["Home","Documents","Pictures","Music","Downloads","Trash"].map((n) =>
      el("button", { class: "files-nav", onclick: () => go([n]) }, [
        el("i", { class: `fa-solid fa-${n === "Trash" ? "trash-can" : n === "Home" ? "house" : "folder"}` }),
        el("span", {}, n),
      ])),
  ]);

  const crumbs = el("div", { class: "files-crumbs" });
  const grid = el("div", { class: "files-grid" });
  const toolbar = el("div", { class: "files-toolbar" }, [
    el("button", { class: "files-tb", title: "Back", onclick: () => { if (path.length>1) { path.pop(); render(); } } }, [el("i",{class:"fa-solid fa-arrow-left"})]),
    crumbs,
    el("div", { class: "files-spacer" }),
    el("button", { class: "files-tb", title: "Toggle view", onclick: () => { view = view==="grid"?"list":"grid"; render(); } }, [el("i",{class:"fa-solid fa-table-cells"})]),
  ]);

  function go(p){ path = p; render(); }
  function open(name, kind){
    if (kind === "folder") { path.push(name); render(); return; }
    emit("toast", { title: name, body: "Opened preview" });
  }
  function render(){
    crumbs.innerHTML = "";
    path.forEach((seg, i) => {
      crumbs.append(el("button", { class: "files-crumb", onclick: () => go(path.slice(0, i+1)) }, seg));
      if (i < path.length-1) crumbs.append(el("span", { class: "files-sep" }, "/"));
    });
    grid.className = `files-${view}`;
    grid.innerHTML = "";
    const items = FS[path[path.length-1]] || [];
    if (!items.length) grid.append(el("div", { class: "files-empty" }, "This folder is empty"));
    items.forEach(([name, icon]) => {
      const kind = icon === "folder" ? "folder" : "file";
      grid.append(el("button", { class: `files-item ${kind}`, ondblclick: () => open(name, kind), onclick: (e)=>{grid.querySelectorAll(".files-item").forEach(n=>n.classList.remove("sel"));e.currentTarget.classList.add("sel");} }, [
        el("i", { class: `fa-solid fa-${icon}` }),
        el("span", {}, name),
      ]));
    });
  }

  root.append(sidebar, el("div", { class: "files-main" }, [toolbar, grid]));
  render();
  return root;
}