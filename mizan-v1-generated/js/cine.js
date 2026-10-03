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
 *   0  settle     0-700     skyline recedes from the bottom edge; title and lede hold
 *   1  type out   760-1300  title rises and fades, tracking opens; camera push begins after this
 *   2  doors rise 1200-2000 glass doors fade up; skyline and tower push in and blur
 *   3  doors part 2300-3100 doors slide apart as if walking through
 *   4  chamber    2150-2800 the strategy chamber settles in behind the doors (then holds, interactive)
 */
(function () {
  "use strict";
  var C = window.MIZAN_CONFIG, S = C.strategies, KEYS = Object.keys(S);
  var stage = document.getElementById("cineStage"), track = document.getElementById("cineTrack");
  if (!stage || !track) return;
  var TRACK = 4200, LERP = .14, PTR = .08;
  var BEATS = [0, 800, 1700, 2700, 3500];                  /* keys 1..5 */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var NS = "http://www.w3.org/2000/svg";

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function range(s, a, b) { return smooth((s - a) / (b - a)); }
  function eur(n) { return "€" + Number(n).toLocaleString("en-US"); }
  function yrs(n) { return n + (n === 1 ? " year" : " years"); }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* ---------- procedural plates ---------- */
  function skyline(svg, seed, count, minH, maxH, id, lit) {
    var r = rng(seed), x = -30, h = "", wins = "";
    svg.setAttribute("viewBox", "0 0 1600 640"); svg.setAttribute("preserveAspectRatio", "xMidYMax slice");
    var gap = 1600 / count;
    while (x < 1640) {
      var w = gap * (.6 + r() * .7), ht = minH + r() * (maxH - minH), y = 640 - ht;
      h += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + (ht + 2).toFixed(1) + '" />';
      if (r() > .7) h += '<path class="sp" d="M' + (x + w / 2).toFixed(1) + " " + y.toFixed(1) + "V" + (y - 30 - r() * 50).toFixed(1) + '"/>';
      if (r() > .55) h += '<path class="sb" d="M' + (x + w * .2).toFixed(1) + " " + y.toFixed(1) + "V" + (y - 14).toFixed(1) + "H" + (x + w * .8).toFixed(1) + "V" + y.toFixed(1) + '"/>';
      if (lit && r() > .35) wins += '<rect x="' + (x + 3).toFixed(1) + '" y="' + (y + 6).toFixed(1) + '" width="' + (w - 6).toFixed(1) + '" height="' + (ht - 8).toFixed(1) + '" />';
      x += w + r() * 8;
    }
    svg.innerHTML = '<defs><pattern id="' + id + '" width="9" height="13" patternUnits="userSpaceOnUse"><rect x="2" y="3" width="3.2" height="5" /></pattern></defs>' +
      '<g class="bld">' + h + "</g>" + (lit ? '<g class="win" fill="url(#' + id + ')">' + wins + "</g>" : "");
  }
  function tower(svg) {
    svg.setAttribute("viewBox", "0 0 400 1100"); svg.setAttribute("preserveAspectRatio", "xMidYMax meet");
    var body = "M118 1100V640L138 612V330L170 296V130L188 96L200 14L212 96L230 130V296L262 330V612L282 640V1100Z";
    svg.innerHTML =
      '<defs><linearGradient id="tg" x1="0" x2="1"><stop offset="0" stop-color="#0d213f"/><stop offset=".45" stop-color="#16315a"/><stop offset="1" stop-color="#07122a"/></linearGradient>' +
      '<linearGradient id="tl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9A96A" stop-opacity=".9"/><stop offset="1" stop-color="#C9A96A" stop-opacity="0"/></linearGradient>' +
      '<pattern id="tw" width="11" height="15" patternUnits="userSpaceOnUse"><rect x="3" y="4" width="4.5" height="6.5" /></pattern>' +
      '<radialGradient id="ta" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#C9A96A" stop-opacity=".35"/><stop offset="1" stop-color="#C9A96A" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="tc"><path d="' + body + '"/></clipPath></defs>' +
      '<ellipse cx="200" cy="120" rx="150" ry="190" fill="url(#ta)"/>' +
      '<path d="' + body + '" fill="url(#tg)" stroke="#C9A96A" stroke-width="1.4" stroke-opacity=".8"/>' +
      '<g clip-path="url(#tc)"><rect class="twin" x="110" y="90" width="180" height="1010" fill="url(#tw)"/>' +
      '<rect x="196" y="96" width="8" height="1004" fill="url(#tl)" opacity=".7"/>' +
      '<path d="M118 1100V640L138 612V330L170 296V130L188 96L200 14V1100Z" fill="#fff" opacity=".05"/></g>' +
      '<path d="M200 14V-10" stroke="#C9A96A" stroke-width="1.6"/><circle cx="200" cy="-12" r="3" fill="#C9A96A" class="beacon"/>' +
      '<path d="M138 612H262M170 296H230" stroke="#C9A96A" stroke-width="1" stroke-opacity=".7"/>';
  }
  skyline($("#cFar"), 11, 30, 130, 380, "wf", false);
  skyline($("#cMid"), 29, 15, 210, 500, "wm", true);
  tower($("#cTower"));
  function $(s) { return stage.querySelector(s); }

  /* ---------- the chamber (strategy plates, from config) ---------- */
  var ICON = { goldFx: "i-gold", realEstate: "i-re", stable: "i-st" };
  var ch = $("#chamberPlates");
  ch.innerHTML = KEYS.map(function (k, i) {
    var s = S[k];
    return '<article class="plate" style="--i:' + i + '"><svg class="pi" aria-hidden="true"><use href="#' + ICON[k] + '"/></svg>' +
      '<h3>' + esc(s.label) + '</h3><p class="ps">' + esc(k === "goldFx" ? "Algorithm Trader Premium" : "Mizan Group " + s.label) + "</p>" +
      (k === "goldFx" ? '<canvas class="spark" aria-hidden="true"></canvas>' : "") +
      '<dl class="pf"><div><dt>From</dt><dd>' + eur(s.minimum) + "</dd></div><div><dt>Potential return</dt><dd>Up to " + s.potentialReturn + "% p.a.</dd></div><div><dt>Duration</dt><dd>" + yrs(s.duration) + "</dd></div></dl>" +
      '<button class="btn btn-primary" type="button" data-open="invest" data-strategy="' + k + '" data-track="chamber_start_investing">Start Investing</button>' +
      '<a class="plate-link" href="#/' + s.slug + '">Details</a></article>';
  }).join("");
  $("#chamberDisc").textContent = C.disclosure;

  /* ---------- mapping + loop ---------- */
  var target = 0, cur = 0, ptx = 0, pty = 0, pcx = 0, pcy = 0, ticking = false;
  function active() { return track.offsetParent !== null; }
  function readScroll() { if (!active()) return; target = clamp(-track.getBoundingClientRect().top, 0, TRACK); }
  function set(k, v) { stage.style.setProperty(k, v.toFixed(4)); }
  function apply(s) {
    var b1 = range(s, 760, 1300), b4 = range(s, 2150, 2800);
    set("--b0", range(s, 0, 700)); set("--b1", b1); set("--b2", range(s, 1200, 2000)); set("--b3", range(s, 2300, 3100));
    set("--b4", b4); set("--c1", range(s, 1500, 1750) * (1 - range(s, 2050, 2250)));
    stage.classList.toggle("p-type-off", b1 > .55);
    stage.classList.toggle("p-chamber", b4 > .75);
    stage.classList.toggle("p-end", s > TRACK - 40);
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
    if (e.key >= "1" && e.key <= "5") { e.preventDefault(); go(+e.key - 1); }
  });
  Array.prototype.forEach.call(document.querySelectorAll(".c-dots button"), function (b) { b.addEventListener("click", function () { go(+b.dataset.beat); }); });

  readScroll(); cur = target; apply(cur); set("--px", 0); set("--py", 0); request();
})();
