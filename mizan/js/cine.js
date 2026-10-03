/*
 * MIZAN GROUP FZCO — scroll-driven cinematic hero ("the journey").
 *
 * Mechanism: a tall track with a position:sticky stage. Scroll distance is mapped through a
 * smoothstep into CSS custom properties on the stage, throttled on requestAnimationFrame and
 * eased toward its target with a lerp (0.14). Every layer reads those variables in CSS; this
 * file never writes per-layer styles. A light pointer parallax is layered on top.
 *
 * Everything drawn is an illustration (procedural skyline, tower, glass doors). Nothing here is a
 * Mizan project, a price or a performance figure. Figures in the final "chamber" come from config.js.
 *
 * Beats over TRACK px of scroll:
 *   b0 settle        0-700     the wide skyline settles; title and lede hold
 *   b1 type out    760-1300    title rises and fades, tracking opens
 *   photos 1..5   1100-4800    skyline > towers > street canyon > aerial > facade; each fades in and pushes in
 *   z3 floor      4700-5300    through the window into the trading floor (simulated screens)
 *   z4 chamber    5400-6000    floor defocuses; the strategy chamber appears (then holds, interactive)
 */
(function () {
  "use strict";
  var C = window.MIZAN_CONFIG, S = C.strategies, KEYS = Object.keys(S);
  var stage = document.getElementById("cineStage"), track = document.getElementById("cineTrack");
  if (!stage || !track) return;
  var TRACK = 6200, LERP = .14, PTR = .08;
  var BEATS = [0, 1300, 2500, 3700, 5100, 6100];            /* keys 1..6 */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var NS = "http://www.w3.org/2000/svg";

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function range(s, a, b) { return smooth((s - a) / (b - a)); }
  function eur(n) { return "€" + Number(n).toLocaleString("en-US"); }
  function yrs(n) { return n + (n === 1 ? " year" : " years"); }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function $(s) { return stage.querySelector(s); }

  /* ---------- the chamber (strategy plates, from config) ---------- */
  var ICON = { goldFx: "i-gold", realEstate: "i-re", stable: "i-st" };
  var I = window.MizanI18n, tr = I ? I.t : function (s) { return s; }, eur = I ? I.eur : function (n) { return "€" + Number(n).toLocaleString("en-US"); };
  var yrs = I ? I.years : function (n) { return n + (n === 1 ? " year" : " years"); };
  function renderChamber() {
    $("#chamberPlates").innerHTML = KEYS.map(function (k, i) {
      var s = S[k];
      return '<article class="plate" style="--i:' + i + '"><svg class="pi" aria-hidden="true"><use href="#' + ICON[k] + '"/></svg>' +
        '<h3>' + esc(tr(s.label)) + '</h3><p class="ps">' + esc(k === "goldFx" ? "Algorithm Trader Premium" : s.name) + "</p>" +
        (k === "goldFx" ? '<canvas class="spark" aria-hidden="true"></canvas>' : "") +
        '<dl class="pf"><div><dt>' + esc(tr("From")) + "</dt><dd>" + eur(s.minimum) + "</dd></div><div><dt>" + esc(tr("Potential return")) + "</dt><dd>" + esc(tr("Up to {n}% p.a.", { n: s.potentialReturn })) + "</dd></div><div><dt>" + esc(tr("Duration")) + "</dt><dd>" + yrs(s.duration) + "</dd></div></dl>" +
        '<button class="btn btn-primary" type="button" data-open="invest" data-strategy="' + k + '" data-track="chamber_start_investing">' + esc(tr("Start Investing")) + '</button>' +
        '<a class="plate-link" href="#/' + s.slug + '">' + esc(tr("Details")) + '</a></article>';
    }).join("");
    $("#chamberDisc").textContent = tr(C.disclosure);
    if (window.MizanFx) window.MizanFx.initSparks();
  }
  renderChamber();
  if (I) I.onChange(renderChamber);

  /* ---------- optional real footage: scroll scrubs the video ---------- */
  var CV = C.cineVideo, vid = null;
  if (CV && CV.src) {
    stage.classList.add("has-video");
    vid = document.createElement("video"); vid.className = "layer c-video"; vid.muted = true; vid.playsInline = true; vid.preload = "auto"; vid.setAttribute("aria-hidden", "true");
    if (CV.poster) vid.poster = CV.poster; vid.src = CV.src; stage.insertBefore(vid, $("#chamber"));
  }
  function scrub(s) {
    if (!vid || !vid.duration || vid.seeking) return;
    var a = CV.start || 0, b = CV.end || vid.duration, t = a + (b - a) * range(s, CV.from || 500, CV.to || 3500);
    if (Math.abs(vid.currentTime - t) > .03) vid.currentTime = t;
  }

  /* ---------- mapping + loop ---------- */
  var target = 0, cur = 0, ptx = 0, pty = 0, pcx = 0, pcy = 0, ticking = false;
  function active() { return track.offsetParent !== null; }
  function readScroll() { if (!active()) return; target = clamp(-track.getBoundingClientRect().top, 0, TRACK); }
  function set(k, v) { stage.style.setProperty(k, v.toFixed(4)); }
  /* Photo journey: each plate has a window [fadeInStart, fadeInEnd] .. [fadeOutStart, fadeOutEnd]. */
  var PH = [[0, 0, 1100, 1500], [1100, 1500, 1900, 2300], [1900, 2300, 2700, 3100], [2700, 3100, 3500, 3900], [3500, 3900, 4300, 4800]];
  function apply(s) {
    var b1 = range(s, 760, 1300), z3 = range(s, 4700, 5300), z4 = range(s, 5400, 6000);
    set("--b0", range(s, 0, 700)); set("--b1", b1);
    PH.forEach(function (p, i) {
      var v = (p[1] > 0 ? range(s, p[0], p[1]) : 1) * (1 - range(s, p[2], p[3]));
      set("--v" + (i + 1), v); set("--q" + (i + 1), clamp((s - p[0]) / (p[3] - p[0]), 0, 1));
    });
    set("--z3", z3); set("--z4", z4);
    set("--c1", range(s, 1600, 1800) * (1 - range(s, 2200, 2400))); set("--c2", range(s, 5000, 5200) * (1 - range(s, 5500, 5700)));
    stage.classList.toggle("p-type-off", b1 > .55);
    stage.classList.toggle("p-chamber", z4 > .5);
    stage.classList.toggle("p-end", s > TRACK - 40);
    if (window.MizanScene && !vid) window.MizanScene.floor(z3 > .02);
    scrub(s);
  }
  function frame() {
    ticking = false;
    var k = reduce.matches ? 1 : LERP, d = target - cur;
    cur = Math.abs(d) < .05 ? target : cur + d * k;
    var pk = reduce.matches ? 0 : PTR; pcx += (ptx - pcx) * pk; pcy += (pty - pcy) * pk;
    apply(cur); set("--px", pcx); set("--py", pcy);
    if (cur !== target || Math.abs(ptx - pcx) > .001 || Math.abs(pty - pcy) > .001) request();
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener("scroll", function () { readScroll(); request(); }, { passive: true });
  window.addEventListener("resize", function () { readScroll(); request(); });
  window.addEventListener("hashchange", function () { setTimeout(function () { readScroll(); cur = target; request(); }, 0); });
  stage.addEventListener("pointermove", function (e) {
    if (reduce.matches) return; var b = stage.getBoundingClientRect();
    ptx = ((e.clientX - b.left) / b.width - .5) * 2; pty = ((e.clientY - b.top) / b.height - .5) * 2; request();
  }, { passive: true });
  stage.addEventListener("pointerleave", function () { ptx = pty = 0; request(); });

  /* keys 1..5 and dots */
  function go(i) {
    var y = window.pageYOffset + track.getBoundingClientRect().top + BEATS[i];
    window.scrollTo({ top: y, behavior: reduce.matches ? "auto" : "smooth" });
  }
  window.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || !active()) return;
    var t = e.target && e.target.tagName; if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT") return;
    if (document.querySelector("dialog[open]")) return;
    if (e.key >= "1" && e.key <= "6") { e.preventDefault(); go(+e.key - 1); }
  });
  Array.prototype.forEach.call(document.querySelectorAll(".c-dots button"), function (b) { b.addEventListener("click", function () { go(+b.dataset.beat); }); });

  var firstPhoto = stage.querySelector(".ph1");                                      /* if the photographs fail to load, fall back to the generated city */
  if (firstPhoto) firstPhoto.addEventListener("error", function () { if (window.MizanScene) window.MizanScene.fallback(); });

  /* The stage starts under the top bar and header, so at scroll 0 its bottom edge (ticker, scene dots) sits exactly at the bottom of the viewport. */
  function setHdr() {
    var tb = document.querySelector(".topbar"), hd = document.querySelector("header.site");
    if (tb && hd) document.documentElement.style.setProperty("--hdr-h", (tb.offsetHeight + hd.offsetHeight) + "px");
  }
  setHdr(); window.addEventListener("resize", setHdr); if (I) I.onChange(function () { setTimeout(setHdr, 0); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setHdr);

  readScroll(); cur = target; apply(cur); set("--px", 0); set("--py", 0); request();
})();
