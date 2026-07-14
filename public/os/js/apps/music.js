/* Music — playlist with play/pause/prev/next and progress. Uses SoundHelix samples. */
import { el } from "../utils.js";

const TRACKS = [
  { title: "Aurora Drift",  artist: "Nebula Ensemble", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", cover: "https://picsum.photos/seed/aurora/300" },
  { title: "Prism Bloom",   artist: "Lumen",           src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", cover: "https://picsum.photos/seed/prism/300" },
  { title: "Stellar Tide",  artist: "Onyx Field",      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", cover: "https://picsum.photos/seed/stellar/300" },
  { title: "Ember Glow",    artist: "Coral Sky",       src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3", cover: "https://picsum.photos/seed/ember/300" },
];

export function buildMusic() {
  const root = el("div", { class: "app music-app" });
  const audio = new Audio();
  let i = 0, playing = false;

  const cover = el("img", { class: "mu-cover", src: TRACKS[0].cover, alt: "" });
  const title = el("div", { class: "mu-title" }, TRACKS[0].title);
  const artist = el("div", { class: "mu-artist" }, TRACKS[0].artist);
  const bar = el("div", { class: "mu-bar" }, [el("div", { class: "mu-fill" })]);
  const time = el("div", { class: "mu-time" }, "0:00 / 0:00");

  const fmt = (s) => { s = Math.max(0, s|0); return `${(s/60|0)}:${String(s%60).padStart(2,"0")}`; };
  function load(idx, autoplay) {
    i = (idx + TRACKS.length) % TRACKS.length;
    const t = TRACKS[i];
    audio.src = t.src; cover.src = t.cover; title.textContent = t.title; artist.textContent = t.artist;
    list.querySelectorAll(".mu-row").forEach((n,k)=>n.classList.toggle("active", k===i));
    if (autoplay) play();
  }
  function play(){ audio.play().then(()=>{ playing=true; playBtn.querySelector("i").className="fa-solid fa-pause"; }).catch(()=>{}); }
  function pause(){ audio.pause(); playing=false; playBtn.querySelector("i").className="fa-solid fa-play"; }
  audio.addEventListener("timeupdate", () => {
    const p = audio.duration ? audio.currentTime/audio.duration*100 : 0;
    bar.firstChild.style.width = p + "%";
    time.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration||0)}`;
  });
  audio.addEventListener("ended", () => load(i+1, true));
  bar.addEventListener("click", (e) => {
    const r = bar.getBoundingClientRect();
    if (audio.duration) audio.currentTime = ((e.clientX-r.left)/r.width) * audio.duration;
  });

  const playBtn = el("button", { class: "mu-btn mu-play", onclick: () => playing?pause():play() }, [el("i",{class:"fa-solid fa-play"})]);
  const controls = el("div", { class: "mu-controls" }, [
    el("button", { class: "mu-btn", onclick: () => load(i-1, true) }, [el("i",{class:"fa-solid fa-backward-step"})]),
    playBtn,
    el("button", { class: "mu-btn", onclick: () => load(i+1, true) }, [el("i",{class:"fa-solid fa-forward-step"})]),
  ]);

  const list = el("div", { class: "mu-list" },
    TRACKS.map((t, k) => el("button", { class: `mu-row ${k===0?"active":""}`, onclick: () => load(k, true) }, [
      el("img", { src: t.cover, alt: "" }),
      el("div", {}, [el("div",{class:"mu-row-t"}, t.title), el("div",{class:"mu-row-a"}, t.artist)]),
    ])));

  const player = el("div", { class: "mu-player" }, [cover, title, artist, bar, time, controls]);
  root.append(player, list);
  load(0, false);
  return root;
}