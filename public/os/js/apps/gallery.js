/* Gallery — masonry image grid with lightbox. Uses picsum.photos seeds. */
import { el } from "../utils.js";

const SEEDS = ["aurora","nebula","prism","glacier","dune","coral","forest","ember","tide","stellar","onyx","lumen"];

export function buildGallery() {
  const root = el("div", { class: "app gallery-app" });
  const grid = el("div", { class: "gl-grid" });

  SEEDS.forEach((s, i) => {
    const w = 400 + (i % 3) * 80, h = 300 + ((i*37) % 200);
    const src = `https://picsum.photos/seed/${s}/${w}/${h}`;
    const full = `https://picsum.photos/seed/${s}/1600/1000`;
    grid.append(el("button", { class: "gl-cell", onclick: () => open(full, s) }, [
      el("img", { src, alt: s, loading: "lazy" }),
      el("div", { class: "gl-cap" }, s),
    ]));
  });

  function open(src, name) {
    const lb = el("div", { class: "gl-lightbox", onclick: () => lb.remove() }, [
      el("img", { src, alt: name }),
      el("div", { class: "gl-caption" }, name),
      el("button", { class: "gl-close" }, [el("i",{class:"fa-solid fa-xmark"})]),
    ]);
    root.append(lb);
  }

  root.append(grid);
  return root;
}