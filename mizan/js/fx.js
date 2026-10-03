/*
 * MIZAN GROUP FZCO — motion & interactive visuals (vanilla JS, canvas/SVG, no libraries).
 *
 * IMPORTANT: everything drawn here is DECORATIVE and SYNTHETIC.
 *   - The forex-style candles and sparklines are a random walk, not market data, not performance.
 *   - The skyline and tower are illustrations, not Mizan projects.
 * The page labels these as illustrative. Do not bind them to real prices or returns.
 *
 * Honours prefers-reduced-motion (single static frame) and pauses when off-screen or tab hidden.
 */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var GOLD = "201,169,106", WHITE = "255,255,255", STEEL = "120,150,200";

  /* seeded PRNG so the skyline is stable between loads */
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* run fn(dt) every frame while `el` is on screen and the tab is visible */
  function loop(el, fn) {
    var on = true, vis = true, last = 0, raf = 0;
    function tick(t) { raf = 0; if (!(on && vis)) { last = 0; return; } var dt = last ? Math.min(.05, (t - last) / 1000) : 0; last = t; fn(dt); raf = requestAnimationFrame(tick); }
    function kick() { if (!raf && on && vis && !reduce.matches) raf = requestAnimationFrame(tick); }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { on = e[0].isIntersecting; kick(); }, { threshold: 0 }).observe(el);
    document.addEventListener("visibilitychange", function () { vis = !document.hidden; kick(); });
    kick(); fn(0);                                                    /* always paint one frame */
    return kick;
  }

  /* ============ HERO: parallax wireframe skyline + streaming forex-style candles ============ */
  function heroFx(canvas) {
    var host = canvas.closest("#cineStage") || canvas.parentElement.parentElement || canvas.parentElement;
    var showSkyline = canvas.dataset.skyline !== "off";
    var ctx = canvas.getContext("2d"); if (!ctx) return;
    var W = 0, H = 0, dpr = 1;
    var ptr = { x: 0, y: 0, tx: 0, ty: 0, cx: -1, cy: -1 };             /* eased + raw (canvas px) */
    var layers = [], hover = null, lit = 0;

    function build() {
      var r = rng(7);
      layers = [{ d: .25, a: .10, n: 15 }, { d: .55, a: .17, n: 11 }, { d: 1, a: .30, n: 8 }].map(function (L) {
        var towers = [], x = -40;
        while (x < W + 120) {
          var w = (W / L.n) * (.55 + r() * .6), h = H * (.28 + r() * .5) * (L.d === 1 ? 1 : .8 + L.d * .2);
          towers.push({ x: x, w: w, h: h, spire: r() > .72, setback: r() > .5 }); x += w + (r() * 16);
        }
        return { d: L.d, a: L.a, towers: towers };
      });
    }
    /* candles */
    var CW = 13, candles = [], off = 0, price = 0;
    function newCandle() {
      var o = price, steps = 4, hi = o, lo = o, c = o;
      for (var i = 0; i < steps; i++) { c += (Math.random() - .5) * .55 + (Math.sin(candles.length / 23) * .05); hi = Math.max(hi, c); lo = Math.min(lo, c); }
      price = c; return { o: o, c: c, h: hi + Math.random() * .12, l: lo - Math.random() * .12 };
    }
    function seedCandles() { candles = []; price = 0; var n = Math.ceil(W * .62 / CW) + 3; for (var i = 0; i < n; i++) candles.push(newCandle()); }
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var b = host.getBoundingClientRect(); W = Math.round(b.width); H = Math.round(b.height);
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build(); seedCandles();
    }
    size();
    var ro = "ResizeObserver" in window ? new ResizeObserver(function () { size(); draw(); }) : null; if (ro) ro.observe(host); else window.addEventListener("resize", function () { size(); draw(); });

    host.addEventListener("pointermove", function (e) {
      var b = host.getBoundingClientRect(); ptr.cx = e.clientX - b.left; ptr.cy = e.clientY - b.top;
      ptr.tx = (ptr.cx / b.width - .5) * 2; ptr.ty = (ptr.cy / b.height - .5) * 2; if (reduce.matches) draw();
    }, { passive: true });
    host.addEventListener("pointerleave", function () { ptr.tx = ptr.ty = 0; ptr.cx = ptr.cy = -1; });

    function drawSkyline(t) {
      var base = H;
      layers.forEach(function (L, li) {
        var ox = ptr.x * -34 * L.d, oy = ptr.y * -10 * L.d;
        ctx.lineWidth = L.d === 1 ? 1.1 : .8;
        L.towers.forEach(function (tw, ti) {
          var x = tw.x + ox, h = tw.h, y = base - h + oy, isHover = false;
          if (L.d === 1 && ptr.cx >= 0 && ptr.cx > x && ptr.cx < x + tw.w && ptr.cy > y - 30) isHover = true;
          if (isHover) { hover = tw; }
          var lift = isHover ? 8 : 0, a = isHover ? Math.min(.9, L.a + .45) : L.a;
          ctx.strokeStyle = "rgba(" + GOLD + "," + a + ")";
          ctx.beginPath(); ctx.rect(x, y - lift, tw.w, h + lift + 2);
          if (tw.setback) { ctx.moveTo(x + tw.w * .2, y - lift); ctx.lineTo(x + tw.w * .2, y - lift - h * .12); ctx.lineTo(x + tw.w * .8, y - lift - h * .12); ctx.lineTo(x + tw.w * .8, y - lift); }
          if (tw.spire) { ctx.moveTo(x + tw.w / 2, y - lift); ctx.lineTo(x + tw.w / 2, y - lift - h * .22); }
          ctx.stroke();
          if (L.d >= .55) {                                                /* floor lines */
            ctx.strokeStyle = "rgba(" + GOLD + "," + (a * .45) + ")"; ctx.beginPath();
            for (var f = y + 16; f < base; f += 16) { ctx.moveTo(x, f - lift); ctx.lineTo(x + tw.w, f - lift); }
            ctx.stroke();
          }
          if (isHover) {                                                   /* lit floors rising */
            var g = ctx.createLinearGradient(0, y, 0, base); g.addColorStop(0, "rgba(" + GOLD + ",.30)"); g.addColorStop(1, "rgba(" + GOLD + ",.02)");
            ctx.fillStyle = g; ctx.fillRect(x, y - lift, tw.w, h + lift);
            var n = Math.floor(lit) % Math.max(1, Math.floor(h / 16)); ctx.fillStyle = "rgba(" + WHITE + ",.32)"; ctx.fillRect(x + 2, base - 16 * (n + 1) - lift, tw.w - 4, 6);
          }
        });
      });
    }
    function drawChart(t) {
      var x0 = W * .30, x1 = W, top = H * .26, bot = H * .78, hgt = bot - top;
      /* gentle drift of the chart with pointer */
      var ox = ptr.x * -10;
      ctx.save(); ctx.beginPath(); ctx.rect(x0, top - 20, x1 - x0, hgt + 40); ctx.clip();
      ctx.strokeStyle = "rgba(" + WHITE + ",.05)"; ctx.lineWidth = 1; ctx.beginPath();
      for (var i = 0; i <= 5; i++) { var gy = top + hgt * i / 5; ctx.moveTo(x0, gy); ctx.lineTo(x1, gy); }
      ctx.stroke();
      var mn = Infinity, mx = -Infinity; candles.forEach(function (c) { mn = Math.min(mn, c.l); mx = Math.max(mx, c.h); });
      var sc = hgt / Math.max(1.5, mx - mn), mid = (mx + mn) / 2, cy = function (v) { return top + hgt / 2 - (v - mid) * sc; };
      var xs = x1 - candles.length * CW + off + ox;
      var ma = [];
      candles.forEach(function (c, i) {
        var x = xs + i * CW, up = c.c >= c.o;
        ctx.strokeStyle = up ? "rgba(" + GOLD + ",.85)" : "rgba(" + STEEL + ",.7)"; ctx.fillStyle = up ? "rgba(" + GOLD + ",.55)" : "rgba(" + STEEL + ",.25)";
        ctx.beginPath(); ctx.moveTo(x + CW / 2, cy(c.h)); ctx.lineTo(x + CW / 2, cy(c.l)); ctx.stroke();
        var by = cy(Math.max(c.o, c.c)), bh = Math.max(1.5, Math.abs(cy(c.o) - cy(c.c)));
        ctx.fillRect(x + 2, by, CW - 4, bh); ctx.strokeRect(x + 2.5, by + .5, CW - 5, bh);
        var s = 0, n = 0; for (var k = Math.max(0, i - 7); k <= i; k++) { s += candles[k].c; n++; } ma.push([x + CW / 2, cy(s / n)]);
      });
      ctx.strokeStyle = "rgba(" + WHITE + ",.55)"; ctx.lineWidth = 1.4; ctx.beginPath();
      ma.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.stroke();
      var last = candles[candles.length - 1], ly = cy(last.c), lx = xs + (candles.length - .5) * CW;
      ctx.setLineDash([4, 6]); ctx.strokeStyle = "rgba(" + GOLD + ",.5)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, ly); ctx.lineTo(x1, ly); ctx.stroke(); ctx.setLineDash([]);
      var pulse = 3 + 2 * (.5 + .5 * Math.sin(t * 3)); ctx.fillStyle = "rgba(" + GOLD + ",1)"; ctx.beginPath(); ctx.arc(lx, ly, 3, 0, 7); ctx.fill();
      ctx.strokeStyle = "rgba(" + GOLD + ",.4)"; ctx.beginPath(); ctx.arc(lx, ly, pulse + 3, 0, 7); ctx.stroke();
      ctx.restore();
    }
    var clock = 0;
    function draw(dt) {
      dt = dt || 0; clock += dt; lit += dt * 9;
      ptr.x += (ptr.tx - ptr.x) * .06; ptr.y += (ptr.ty - ptr.y) * .06;
      off -= dt * 22; while (off <= -CW) { off += CW; candles.shift(); candles.push(newCandle()); }
      ctx.clearRect(0, 0, W, H); hover = null;
      if (showSkyline) drawSkyline(clock); drawChart(clock);
    }
    loop(host, draw);
  }

  /* ============ small forex-style sparklines (decorative) ============ */
  function sparkFx(cv) {
    if (cv.dataset.on) return; cv.dataset.on = "1";
    var ctx = cv.getContext("2d"); if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2), W = cv.clientWidth || 280, H = cv.clientHeight || 56;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var N = Math.max(30, Math.floor(W / 5)), v = [], p = 0, acc = 0;
    for (var i = 0; i < N; i++) { p += (Math.random() - .45) * .6; v.push(p); }
    function draw(dt) {
      var cw = cv.clientWidth;
      if (cw && Math.abs(cw - W) > 2) { W = cw; H = cv.clientHeight || H; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
      acc += dt; while (acc > .09) { acc -= .09; p += (Math.random() - .45) * .6; v.push(p); v.shift(); }
      var mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), s = (H - 10) / Math.max(1, mx - mn);
      ctx.clearRect(0, 0, W, H);
      var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "rgba(" + GOLD + ",.28)"); g.addColorStop(1, "rgba(" + GOLD + ",0)");
      ctx.beginPath(); v.forEach(function (y, i) { var X = i * W / (N - 1), Y = H - 5 - (y - mn) * s; if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
      ctx.strokeStyle = "rgb(176,138,60)"; ctx.lineWidth = 1.6; ctx.stroke(); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
    }
    loop(cv, draw);
  }
  function initSparks() { Array.prototype.forEach.call(document.querySelectorAll("canvas.spark:not([data-on])"), sparkFx); }

  /* ============ REAL ESTATE: interactive isometric tower ============ */
  var FLOORS = [
    ["Land acquisition", "Acquiring land for a potential project."],
    ["Property acquisition", "Purchasing existing property."],
    ["Preparatory development costs", "Early-stage costs that precede construction."],
    ["Development", "Developing property."],
    ["Renovation", "Renovating existing buildings."],
    ["Refurbishment", "Refurbishing interiors and fit-out."],
    ["Project financing", "Financing for real-estate projects."],
    ["Sales & marketing", "Costs of marketing and selling property."],
    ["Other relevant project costs", "Other costs relevant to a project."]
  ];
  function towerFx(box) {
    var I = window.MizanI18n, tr = I ? I.t : function (s) { return s; };
    var NS = "http://www.w3.org/2000/svg", cx = 260, base = 640, t = 30, step = 56;
    var svg = document.createElementNS(NS, "svg"); svg.setAttribute("viewBox", "0 0 520 720"); svg.setAttribute("class", "tw-svg"); svg.setAttribute("aria-hidden", "true");
    var gGrid = document.createElementNS(NS, "g"), gT = document.createElementNS(NS, "g"); gT.setAttribute("class", "tw-g");
    for (var i = -6; i <= 6; i++) {
      gGrid.innerHTML += '<line x1="' + (cx + i * 36 - 216) + '" y1="' + (base + 40 + 108 - i * 18) + '" x2="' + (cx + i * 36 + 216) + '" y2="' + (base + 40 - 108 - i * 18) + '"/>';
      gGrid.innerHTML += '<line x1="' + (cx - i * 36 - 216) + '" y1="' + (base + 40 - 108 + i * 18) + '" x2="' + (cx - i * 36 + 216) + '" y2="' + (base + 40 + 108 + i * 18) + '"/>';
    }
    gGrid.setAttribute("class", "tw-grid");
    var slabs = [];
    FLOORS.forEach(function (f, i) {
      var w = 150 - i * 4, d = w / 2, y = base - i * step, g = document.createElementNS(NS, "g"); g.setAttribute("class", "slab"); g.dataset.i = i;
      g.innerHTML = '<polygon class="face l" points="' + (cx - w) + "," + y + " " + cx + "," + (y + d) + " " + cx + "," + (y + d + t) + " " + (cx - w) + "," + (y + t) + '"/>' +
        '<polygon class="face r" points="' + cx + "," + (y + d) + " " + (cx + w) + "," + y + " " + (cx + w) + "," + (y + t) + " " + cx + "," + (y + d + t) + '"/>' +
        '<polygon class="face top" points="' + cx + "," + (y - d) + " " + (cx + w) + "," + y + " " + cx + "," + (y + d) + " " + (cx - w) + "," + y + '"/>';
      gT.appendChild(g); slabs.push(g);
    });
    var topY = base - (FLOORS.length - 1) * step - 150 * .5;
    gT.innerHTML += '<line class="spire" x1="' + cx + '" y1="' + (topY + 20) + '" x2="' + cx + '" y2="' + (topY - 60) + '"/>';
    var scan = document.createElementNS(NS, "line"); scan.setAttribute("class", "scan"); scan.setAttribute("x1", cx - 170); scan.setAttribute("x2", cx + 170);
    svg.appendChild(gGrid); svg.appendChild(gT); svg.appendChild(scan);

    var stage = box.querySelector(".tw-stage"), list = box.querySelector(".tw-list"), info = box.querySelector(".tw-info");
    stage.appendChild(svg);
    var cur = -1, userTouched = false;
    function renderList() {
      list.innerHTML = FLOORS.map(function (f, i) { return '<li><button type="button" data-i="' + i + '" aria-pressed="' + (i === cur) + '">' + tr(f[0]) + '</button></li>'; }).reverse().join("");
      showInfo();
    }
    function showInfo() {
      info.innerHTML = cur < 0 ? "<b>" + tr("Potential uses of proceeds") + "</b><span>" + tr("Select a floor to explore.") + "</span>" : "<b>" + tr(FLOORS[cur][0]) + "</b><span>" + tr(FLOORS[cur][1]) + "</span>";
    }
    function pick(i, byUser) {
      if (byUser) userTouched = true;
      if (i === cur && !byUser) return;
      cur = i;
      slabs.forEach(function (s, k) { s.classList.toggle("on", k === i); });
      Array.prototype.forEach.call(list.querySelectorAll("button"), function (b) { var on = +b.dataset.i === i; b.setAttribute("aria-pressed", on); });
      showInfo();
    }
    renderList();
    if (I) I.onChange(renderList);
    svg.addEventListener("pointermove", function (e) { var s = e.target.closest(".slab"); if (s) pick(+s.dataset.i, true); });
    svg.addEventListener("click", function (e) { var s = e.target.closest(".slab"); if (s) pick(+s.dataset.i, true); });
    list.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) pick(+b.dataset.i, true); });
    list.addEventListener("focusin", function (e) { var b = e.target.closest("button"); if (b) pick(+b.dataset.i, true); });
    svg.style.pointerEvents = "auto";
    box.addEventListener("pointermove", function (e) {
      if (reduce.matches) return; var b = stage.getBoundingClientRect();
      var x = clamp((e.clientX - b.left) / b.width - .5, -.5, .5), y = clamp((e.clientY - b.top) / b.height - .5, -.5, .5);
      stage.style.setProperty("--ry", (x * 16).toFixed(2) + "deg"); stage.style.setProperty("--rx", (-y * 8).toFixed(2) + "deg");
    });
    box.addEventListener("pointerleave", function () { stage.style.setProperty("--ry", "0deg"); stage.style.setProperty("--rx", "0deg"); });
    var pos = 0;
    function frame(dt) {
      if (reduce.matches) return;
      pos += dt * .12; if (pos > 1.1) pos = 0;
      var y = base + 40 - pos * (base + 40 - (topY - 70)); scan.setAttribute("y1", y); scan.setAttribute("y2", y);
      if (!userTouched) { var fl = Math.floor((base + 40 - y) / step); pick(clamp(fl, -1, FLOORS.length - 1), false); }
    }
    loop(box, frame);
  }

  window.MizanFx = {
    init: function () {
      var h = document.getElementById("heroCanvas"); if (h) heroFx(h);
      var t = document.getElementById("tower"); if (t) towerFx(t);
      initSparks();
    },
    initSparks: initSparks
  };
})();
