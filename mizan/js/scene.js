/*
 * MIZAN GROUP FZCO — procedural photoreal-style plates for the cinematic hero.
 *
 * Draws, once and offscreen-cheap, the layers the camera travels through:
 *   sky -> far city -> near city -> glass skyscraper -> curtain-wall facade (zoom) -> trading floor (animated).
 * Everything is generated in code (no images, no network). It is ILLUSTRATIVE: not a Mizan project, and the
 * trading-floor screens show SIMULATED data only (never live or historical prices, never performance).
 *
 * To use real photography instead, set MIZAN_CONFIG.cinePlates = { sky, far, mid, tower, facade, floor }
 * to image URLs. Any plate with a URL replaces its generated canvas. See README.
 */
(function () {
  "use strict";
  var stage = document.getElementById("cineStage"); if (!stage) return;
  var C = window.MIZAN_CONFIG || {}, plates = C.cinePlates || {};
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function $(id) { return document.getElementById(id); }
  function size(cv, w, h) { cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR); var x = cv.getContext("2d"); x.setTransform(DPR, 0, 0, DPR, 0, 0); return x; }
  function lin(ctx, x0, y0, x1, y1, stops) { var g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(function (s) { g.addColorStop(s[0], s[1]); }); return g; }

  /* ---------------- SKY ---------------- */
  function drawSky(cv) {
    var W = stage.clientWidth, H = stage.clientHeight, ctx = size(cv, W, H), r = rng(5);
    ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, "#040c20"], [.32, "#0e2548"], [.58, "#27477a"], [.76, "#a07d6e"], [.88, "#e1ac7b"], [1, "#f4d09c"]]);
    ctx.fillRect(0, 0, W, H);
    var sx = W * .62, sy = H * .84, sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, H * .7);
    sg.addColorStop(0, "rgba(255,226,170,.75)"); sg.addColorStop(.25, "rgba(255,200,140,.32)"); sg.addColorStop(1, "rgba(255,190,120,0)");
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
    for (var i = 0; i < 34; i++) {                                   /* soft horizontal clouds, warmer near the horizon */
      var y = H * (.18 + r() * .62), x = r() * W, rad = 60 + r() * 220, warm = Math.min(1, y / (H * .85));
      ctx.save(); ctx.translate(x, y); ctx.scale(2.6 + r() * 2, .22 + r() * .12);
      var g = ctx.createRadialGradient(0, 0, 0, 0, 0, rad);
      var col = warm > .55 ? "255,196,140" : "150,175,220";
      g.addColorStop(0, "rgba(" + col + "," + (.07 + r() * .12) + ")"); g.addColorStop(1, "rgba(" + col + ",0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rad, 0, 7); ctx.fill(); ctx.restore();
    }
    for (i = 0; i < 90; i++) { ctx.fillStyle = "rgba(255,255,255," + (r() * .5) + ")"; ctx.fillRect(r() * W, r() * H * .32, 1, 1); }
  }

  /* ---------------- CITY LAYERS ---------------- */
  function cityLayer(ctx, W, H, o) {
    var r = rng(o.seed), x = -30;
    while (x < W + 40) {
      var w = o.w[0] + r() * (o.w[1] - o.w[0]), h = H * (o.h[0] + r() * (o.h[1] - o.h[0])), y = H - h;
      ctx.fillStyle = lin(ctx, x, 0, x + w, 0, [[0, o.c1], [1, o.c2]]);
      ctx.fillRect(x, y, w, h + 2);
      if (r() > .62) { var sw = w * (.45 + r() * .3), sh = 6 + r() * 22; ctx.fillRect(x + (w - sw) / 2, y - sh, sw, sh + 1); y -= sh; }
      if (r() > .78) { ctx.fillStyle = o.c2; ctx.fillRect(x + w / 2 - 1, y - 24 - r() * 40, 2, 70); }
      ctx.fillStyle = "rgba(255,206,150," + o.edge + ")"; ctx.fillRect(x, y, 1.2, h);       /* low sun catching the left edges */
      if (o.win) {
        var sx = o.step[0], sy = o.step[1];
        for (var wy = y + 8; wy < H - 4; wy += sy) for (var wx = x + 4; wx < x + w - 4; wx += sx)
          if (r() < o.win) { ctx.fillStyle = "rgba(255," + (190 + r() * 40 | 0) + "," + (120 + r() * 50 | 0) + "," + (.35 + r() * .5) + ")"; ctx.fillRect(wx, wy, sx * .5, sy * .55); }
      }
      x += w + r() * o.gap;
    }
    var hz = lin(ctx, 0, H, 0, H * (1 - o.hazeH), [[0, "rgba(236,186,134," + o.haze + ")"], [1, "rgba(236,186,134,0)"]]);
    ctx.fillStyle = hz; ctx.fillRect(0, 0, W, H);
  }
  function drawFar(cv) {
    var W = stage.clientWidth, H = stage.clientHeight, ctx = size(cv, W, H);
    cityLayer(ctx, W, H, { seed: 3, w: [26, 70], h: [.14, .36], gap: 6, c1: "#3d5680", c2: "#2b4268", edge: .35, win: .05, step: [6, 9], haze: .6, hazeH: .5 });
    cityLayer(ctx, W, H, { seed: 8, w: [34, 90], h: [.2, .46], gap: 10, c1: "#243a63", c2: "#16294b", edge: .4, win: .09, step: [7, 10], haze: .4, hazeH: .42 });
  }
  function drawMid(cv) {
    var W = stage.clientWidth, H = stage.clientHeight, ctx = size(cv, W, H);
    cityLayer(ctx, W, H, { seed: 21, w: [44, 120], h: [.26, .58], gap: 14, c1: "#162645", c2: "#0b1630", edge: .45, win: .2, step: [8, 11], haze: .22, hazeH: .3 });
    cityLayer(ctx, W, H, { seed: 34, w: [60, 150], h: [.18, .42], gap: 30, c1: "#0c1830", c2: "#060d1d", edge: .5, win: .26, step: [9, 12], haze: .1, hazeH: .2 });
  }

  /* ---------------- THE SKYSCRAPER ---------------- */
  function drawTower(cv) {
    var TW = 1400, TH = 3000, ctx = size(cv, TW, TH), r = rng(77), cx = TW * .5;
    var gl = lin(ctx, 0, 0, 0, TH, [[0, "#16356a"], [.35, "#3a68a4"], [.62, "#6f95c2"], [.84, "#c29a78"], [1, "#e6b784"]]);
    var gr = lin(ctx, 0, 0, 0, TH, [[0, "#081833"], [.4, "#13305a"], [.7, "#2a3f66"], [.9, "#5a5160"], [1, "#78605a"]]);
    var tiers = [{ h: .62, wl: .33, wr: .22 }, { h: .17, wl: .27, wr: .18 }, { h: .1, wl: .21, wr: .14 }, { h: .045, wl: .14, wr: .095 }];
    var ybot = TH * .965, tops = [];
    tiers.forEach(function (t, ti) {
      var th = t.h * TH, y0 = ybot - th, xl = cx - t.wl * TW, xr = cx + t.wr * TW;
      ctx.fillStyle = gl; ctx.fillRect(xl, y0, cx - xl, th);
      ctx.fillStyle = gr; ctx.fillRect(cx, y0, xr - cx, th);
      [[xl, cx, 16, .55], [cx, xr, 11, .6]].forEach(function (f, side) {      /* curtain wall: mullions + spandrels + lit cells */
        ctx.strokeStyle = "rgba(6,14,30," + f[3] + ")"; ctx.lineWidth = 1.2; ctx.beginPath();
        for (var mx = f[0] + f[2]; mx < f[1]; mx += f[2]) { ctx.moveTo(mx, y0); ctx.lineTo(mx, y0 + th); }
        for (var fy = y0 + 24; fy < y0 + th; fy += 24) { ctx.moveTo(f[0], fy); ctx.lineTo(f[1], fy); }
        ctx.stroke();
        for (var ly = y0 + 24; ly < y0 + th; ly += 24) for (var lx = f[0]; lx < f[1] - f[2]; lx += f[2]) {
          var q = r();
          if (q < .16) { ctx.fillStyle = "rgba(255," + (196 + r() * 40 | 0) + "," + (130 + r() * 50 | 0) + "," + (.35 + r() * .45) + ")"; ctx.fillRect(lx + 2, ly - 20, f[2] - 3, 18); }
          else if (q < .3) { ctx.fillStyle = "rgba(255,255,255," + (r() * .06) + ")"; ctx.fillRect(lx + 1, ly - 22, f[2] - 2, 22); }
        }
      });
      ctx.fillStyle = "rgba(255,226,170,.55)"; ctx.fillRect(cx - 1.5, y0, 3, th);   /* sunlit corner */
      ctx.fillStyle = "rgba(255,255,255,.10)"; ctx.fillRect(xl, y0, cx - xl, 3);     /* ledge */
      ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(xl, y0 - 5, xr - xl, 5);
      tops.push(y0); ybot = y0;
    });
    var topY = tops[tops.length - 1];
    ctx.fillStyle = lin(ctx, cx - 5, 0, cx + 5, 0, [[0, "#b8c6dc"], [1, "#5b6b86"]]);
    ctx.beginPath(); ctx.moveTo(cx - 9, topY); ctx.lineTo(cx, topY - TH * .1); ctx.lineTo(cx + 9, topY); ctx.fill();
    var bg = ctx.createRadialGradient(cx, topY - TH * .1, 0, cx, topY - TH * .1, 40);
    bg.addColorStop(0, "rgba(255,70,60,1)"); bg.addColorStop(1, "rgba(255,70,60,0)"); ctx.fillStyle = bg; ctx.fillRect(cx - 40, topY - TH * .1 - 40, 80, 80);
    var pw = tiers[0].wl * TW * 1.7;                                               /* podium + lobby glow */
    ctx.fillStyle = "#0a1730"; ctx.fillRect(cx - pw / 2, TH * .965, pw, TH * .035);
    ctx.fillStyle = lin(ctx, 0, TH * .965, 0, TH, [[0, "rgba(255,200,130,.85)"], [1, "rgba(255,200,130,.15)"]]); ctx.fillRect(cx - pw / 2 + 12, TH * .972, pw - 24, TH * .012);
    ctx.globalCompositeOperation = "source-atop";                                  /* gloss + haze only where the tower is */
    ctx.fillStyle = lin(ctx, 0, 0, TW, TH, [[0, "rgba(255,255,255,.14)"], [.5, "rgba(255,255,255,0)"], [1, "rgba(0,0,0,.18)"]]);   /* gloss */
    ctx.fillRect(0, 0, TW, TH);
    ctx.fillStyle = lin(ctx, 0, TH * .78, 0, TH, [[0, "rgba(232,182,128,0)"], [1, "rgba(232,182,128,.45)"]]); ctx.fillRect(0, TH * .78, TW, TH * .22);
    ctx.globalCompositeOperation = "source-over";
  }

  /* ---------------- FACADE (the zoom target) ---------------- */
  var ENTRY = { x: .5, y: .5, w: .30, h: .44 };
  function drawFacade(cv) {
    var W = stage.clientWidth, H = stage.clientHeight, ctx = size(cv, W, H), r = rng(91);
    ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, "#0b2347"], [.4, "#2f5a92"], [.7, "#8aa7cc"], [1, "#e2b384"]]);
    ctx.fillRect(0, 0, W, H);
    var cw = W / 5.4, ch = cw * 1.5, ox = (W / 2) % cw - cw, oy = (H / 2) % ch - ch;
    for (var gy = oy; gy < H + ch; gy += ch) for (var gx = ox; gx < W + cw; gx += cw) {
      var k = r();
      ctx.fillStyle = "rgba(4,10,24," + (.04 + r() * .22) + ")"; ctx.fillRect(gx, gy, cw, ch);          /* per-pane tint */
      if (k < .1) { ctx.fillStyle = lin(ctx, 0, gy, 0, gy + ch, [[0, "#0a1426"], [1, "#16294a"]]); ctx.fillRect(gx + 4, gy + 4, cw - 8, ch - 8);
        ctx.fillStyle = "rgba(255,226,170,.8)"; ctx.fillRect(gx + 14, gy + ch * .18, cw - 28, 3);
        ctx.fillStyle = "rgba(120,180,255,.35)"; ctx.fillRect(gx + cw * .2, gy + ch * .55, cw * .3, ch * .16); }
      ctx.fillStyle = lin(ctx, gx, gy, gx + cw, gy + ch, [[0, "rgba(255,255,255,.18)"], [.45, "rgba(255,255,255,0)"], [1, "rgba(0,0,0,.12)"]]); ctx.fillRect(gx, gy, cw, ch);
    }
    ctx.strokeStyle = "rgba(14,22,40,.95)"; ctx.lineWidth = 7; ctx.beginPath();                          /* steel mullions */
    for (gx = ox; gx < W + cw; gx += cw) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H); }
    for (gy = oy; gy < H + ch; gy += ch) { ctx.moveTo(0, gy); ctx.lineTo(W, gy); }
    ctx.stroke(); ctx.strokeStyle = "rgba(220,235,255,.28)"; ctx.lineWidth = 1.2; ctx.beginPath();
    for (gx = ox; gx < W + cw; gx += cw) { ctx.moveTo(gx - 3, 0); ctx.lineTo(gx - 3, H); }
    ctx.stroke();
    /* the entry window: a lit interior glimpsed through the glass */
    var ew = W * ENTRY.w, eh = H * ENTRY.h, ex = W * ENTRY.x - ew / 2, ey = H * ENTRY.y - eh / 2;
    ctx.fillStyle = lin(ctx, 0, ey, 0, ey + eh, [[0, "#010308"], [1, "#050d1c"]]); ctx.fillRect(ex, ey, ew, eh);
    ctx.save(); ctx.beginPath(); ctx.rect(ex, ey, ew, eh); ctx.clip();
    for (var li = 0; li < 5; li++) { ctx.fillStyle = "rgba(255,236,200," + (.85 - li * .12) + ")"; ctx.fillRect(ex + ew * (.1 + li * .02), ey + eh * (.06 + li * .045), ew * (.8 - li * .04), 2 + li * .4); }   /* ceiling light bars */
    var hz = ctx.createRadialGradient(ex + ew / 2, ey + eh * .6, 0, ex + ew / 2, ey + eh * .6, ew * .6);   /* a soft hazy glow, no hard shapes */
    hz.addColorStop(0, "rgba(150,185,230,.07)"); hz.addColorStop(1, "rgba(150,185,230,0)"); ctx.fillStyle = hz; ctx.fillRect(ex, ey, ew, eh);
    ctx.restore();
    ctx.strokeStyle = "rgba(201,169,106,.9)"; ctx.lineWidth = 5; ctx.strokeRect(ex, ey, ew, eh);
    ctx.fillStyle = lin(ctx, ex, ey, ex + ew, ey + eh, [[0, "rgba(255,255,255,.22)"], [.5, "rgba(255,255,255,0)"]]); ctx.fillRect(ex, ey, ew, eh);     /* glass glare */
    var vg = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .95); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(2,6,14,.55)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }

  /* ---------------- TRADING FLOOR (animated, simulated data) ---------------- */
  var floor = null;
  function initFloor(cv) {
    var W = stage.clientWidth, H = stage.clientHeight, ctx = size(cv, W, H), r = rng(13);
    var wall = document.createElement("canvas"), wx0 = W * .15, wx1 = W * .85, wy0 = H * .09, wy1 = H * .5, ww = wx1 - wx0, wh = wy1 - wy0;
    wall.width = Math.round(ww * DPR); wall.height = Math.round(wh * DPR);
    var wctx = wall.getContext("2d"); wctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var PAIRS = ["EUR/USD", "XAU/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "USD/AED", "EUR/GBP", "NZD/USD", "USD/CAD"];
    var series = [], i; for (i = 0; i < 16; i++) { var v = 0, s = []; for (var k = 0; k < 140; k++) { v += (r() - .5) * .8; s.push(v); } series.push(s); }
    var quotes = PAIRS.map(function () { return { p: 1 + r() * 140, d: r() > .5 ? 1 : -1 }; });
    var st = { t: 0, acc: 0, off: 0 };
    function pushTick() { series.forEach(function (s, ix) { s.push(s[s.length - 1] + (Math.random() - .5) * .8 + Math.sin(st.t * .4 + ix) * .05); s.shift(); });
      quotes.forEach(function (q) { var d = (Math.random() - .5) * .12; q.p = Math.max(.5, q.p * (1 + d / 100)); q.d = d >= 0 ? 1 : -1; }); }
    function miniChart(c, x, y, w, h, s, col, fill) {
      var mn = Math.min.apply(null, s), mx = Math.max.apply(null, s), sc = h / Math.max(1, mx - mn);
      c.beginPath(); s.forEach(function (v, ix) { var X = x + ix * w / (s.length - 1), Y = y + h - (v - mn) * sc; ix ? c.lineTo(X, Y) : c.moveTo(X, Y); });
      c.strokeStyle = col; c.lineWidth = 1.2; c.stroke();
      if (fill) { c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath(); c.fillStyle = fill; c.fill(); }
    }
    function drawWall() {
      var c = wctx; c.clearRect(0, 0, ww, wh);
      c.fillStyle = "#040a17"; c.fillRect(0, 0, ww, wh);
      c.strokeStyle = "rgba(201,169,106,.4)"; c.lineWidth = 1.5; c.strokeRect(1, 1, ww - 2, wh - 2);
      var tb = wh * .12; c.fillStyle = "#07122a"; c.fillRect(0, 0, ww, tb);                               /* scrolling ticker */
      c.save(); c.beginPath(); c.rect(0, 0, ww, tb); c.clip(); c.font = "600 " + (tb * .5 | 0) + "px ui-monospace,Menlo,Consolas,monospace"; c.textBaseline = "middle";
      var x = -(st.off % 900);
      for (var rep = 0; rep < 4; rep++) PAIRS.forEach(function (p, ix) { var q = quotes[ix], up = q.d > 0;
        c.fillStyle = "rgba(255,255,255,.88)"; c.fillText(p, x, tb / 2); x += c.measureText(p).width + 10;
        var num = q.p.toFixed(ix === 3 || ix === 1 ? 2 : 4); c.fillStyle = up ? "#3ddc9a" : "#ff6b6b"; var t2 = num + (up ? " ▲" : " ▼"); c.fillText(t2, x, tb / 2); x += c.measureText(t2).width + 40; });
      c.restore();
      var cx0 = ww * .02, cy0 = tb + wh * .05, cw0 = ww * .58, chh = wh * .6;                              /* main chart */
      c.strokeStyle = "rgba(255,255,255,.07)"; c.lineWidth = 1; c.beginPath(); for (var g = 0; g <= 5; g++) { c.moveTo(cx0, cy0 + chh * g / 5); c.lineTo(cx0 + cw0, cy0 + chh * g / 5); } c.stroke();
      var s0 = series[0], n = 52, cwid = cw0 / n, sl = s0.slice(-n * 3), mn = Math.min.apply(null, sl), mx = Math.max.apply(null, sl), sc = chh / Math.max(1, mx - mn);
      for (i = 0; i < n; i++) { var a = sl[i * 3], b = sl[i * 3 + 3] || a, hi = Math.max(a, b, sl[i * 3 + 1] || a), lo = Math.min(a, b, sl[i * 3 + 2] || b), up = b >= a;
        var xx = cx0 + i * cwid, yy = function (z) { return cy0 + chh - (z - mn) * sc; };
        c.strokeStyle = up ? "#3ddc9a" : "#ff6b6b"; c.fillStyle = up ? "rgba(61,220,154,.75)" : "rgba(255,107,107,.75)";
        c.beginPath(); c.moveTo(xx + cwid / 2, yy(hi)); c.lineTo(xx + cwid / 2, yy(lo)); c.stroke(); c.fillRect(xx + 1, Math.min(yy(a), yy(b)), cwid - 2, Math.max(2, Math.abs(yy(a) - yy(b)))); }
      miniChart(c, cx0, cy0, cw0, chh, series[1].slice(-120), "rgba(201,169,106,.9)");
      var bx = ww * .64, by = tb + wh * .05, bw = ww * .33;                                                  /* depth bars */
      for (i = 0; i < 12; i++) { var up2 = i % 2 === 0, len = (.25 + .6 * (.5 + .5 * Math.sin(st.t * .7 + i * 1.7))) * bw;
        c.fillStyle = up2 ? "rgba(61,220,154,.55)" : "rgba(255,107,107,.55)"; c.fillRect(bx + (up2 ? 0 : bw - len), by + i * wh * .047, len, wh * .032); }
      var ty = wh * .8, tw = ww / 5;                                                                         /* tiles */
      for (i = 0; i < 5; i++) { c.fillStyle = "rgba(255,255,255,.04)"; c.fillRect(i * tw + 4, ty, tw - 8, wh * .17);
        c.fillStyle = "rgba(255,255,255,.8)"; c.font = "600 " + (wh * .035 | 0) + "px ui-monospace,Menlo,monospace"; c.fillText(PAIRS[i], i * tw + 10, ty + wh * .035);
        miniChart(c, i * tw + 10, ty + wh * .06, tw - 20, wh * .09, series[2 + i].slice(-60), i % 2 ? "#ff6b6b" : "#3ddc9a"); }
    }
    function monitor(c, x, y, w, h, ix) {
      var col = ix % 3 === 0 ? "61,220,154" : ix % 3 === 1 ? "130,180,230" : "255,190,110";
      c.fillStyle = "#03070f"; c.fillRect(x - 2, y - 2, w + 4, h + 4);                       /* bezel */
      c.fillStyle = "#050b16"; c.fillRect(x, y, w, h);                                       /* dark screen: no coloured blocks */
      c.strokeStyle = "rgba(" + col + ",.12)"; c.lineWidth = 1; c.beginPath();
      for (var g = 1; g < 4; g++) { c.moveTo(x, y + h * g / 4); c.lineTo(x + w, y + h * g / 4); } c.stroke();
      miniChart(c, x + 3, y + 4, w - 6, h - 8, series[(ix * 3) % 16].slice(-50), "rgba(" + col + ",.9)");
      var gl = c.createRadialGradient(x + w / 2, y + h * 1.4, 0, x + w / 2, y + h * 1.4, w * .8); gl.addColorStop(0, "rgba(" + col + ",.10)"); gl.addColorStop(1, "rgba(" + col + ",0)");
      c.fillStyle = gl; c.fillRect(x - w * .4, y + h, w * 1.8, h * 1.2);                       /* faint spill on the desk only */
    }
    function frame(dt) {
      st.t += dt; st.off += dt * 70; st.acc += dt; while (st.acc > .22) { st.acc -= .22; pushTick(); }
      drawWall();
      ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, "#02050c"], [.5, "#07122a"], [1, "#030813"]]); ctx.fillRect(0, 0, W, H);
      var vpx = W / 2, vpy = H * .42;
      ctx.strokeStyle = "rgba(180,210,255,.22)"; ctx.lineWidth = 1.4; ctx.beginPath();                          /* ceiling light strips */
      for (i = -6; i <= 6; i++) { if (!i) continue; ctx.moveTo(vpx + i * W * .02, vpy - H * .28); ctx.lineTo(vpx + i * W * .2, -10); } ctx.stroke();
      ctx.drawImage(wall, wx0, wy0, ww, wh);
      var wg = ctx.createRadialGradient(W / 2, wy0 + wh / 2, 0, W / 2, wy0 + wh / 2, W * .5); wg.addColorStop(0, "rgba(90,170,255,.16)"); wg.addColorStop(1, "rgba(90,170,255,0)");
      ctx.fillStyle = wg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = lin(ctx, 0, wy1, 0, H, [[0, "#06101f"], [1, "#02060d"]]); ctx.fillRect(0, wy1, W, H - wy1);                     /* polished floor */
      ctx.save(); ctx.globalAlpha = .16; ctx.translate(0, wy1 * 2); ctx.scale(1, -1); ctx.drawImage(wall, wx0, wy0, ww, wh); ctx.restore();
      ctx.fillStyle = lin(ctx, 0, wy1, 0, H, [[0, "rgba(2,6,13,0)"], [.55, "rgba(2,6,13,.9)"], [1, "#02060d"]]); ctx.fillRect(0, wy1, W, H - wy1);
      for (var row = 0; row < 4; row++) {                                                                   /* desk rows, receding */
        var depth = row / 3, sc = .45 + depth * .85, y = wy1 + (H - wy1) * (.1 + depth * .62), n = 7 - (row > 1 ? 2 : 0), mw = W * .062 * sc, mh = mw * .62, gap = mw * .42, tot = n * mw + (n - 1) * gap;
        ctx.fillStyle = "rgba(14,28,52,.9)"; ctx.fillRect(W / 2 - tot / 2 - mw * .6, y + mh + 2, tot + mw * 1.2, mh * .22);
        ctx.fillStyle = "rgba(120,170,255,.25)"; ctx.fillRect(W / 2 - tot / 2 - mw * .6, y + mh + 2, tot + mw * 1.2, 1.5);
        for (var m = 0; m < n; m++) { var mx = W / 2 - tot / 2 + m * (mw + gap); monitor(ctx, mx, y, mw, mh, row * 7 + m);
          if (row > 0) { var hx = mx + mw / 2 + (m % 2 ? mw * .2 : -mw * .2), hy = y + mh * 1.05;
            ctx.fillStyle = "#01040a"; ctx.beginPath(); ctx.arc(hx, hy, mw * .13, 0, 7); ctx.fill();
            ctx.beginPath(); ctx.ellipse(hx, hy + mw * .42, mw * .34, mw * .3, 0, 0, 7); ctx.fill(); } }
      }
      var vg = ctx.createRadialGradient(W / 2, H * .5, H * .25, W / 2, H * .5, H * .95); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(1,3,8,.78)");
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    }
    floor = { frame: frame, still: function () { frame(.5); } };
    frame(.4);
  }

  /* ---------------- build / rebuild ---------------- */
  function usePlate(id, key) {
    var cv = $(id), url = plates[key]; if (!url || !cv || cv.tagName !== "CANVAS") return false;
    var img = new Image(); img.className = cv.className; img.id = id; img.alt = ""; img.setAttribute("aria-hidden", "true"); img.decoding = "async"; img.src = url;
    img.style.objectFit = "cover"; cv.parentNode.replaceChild(img, cv); return true;
  }
  var builtW = 0, builtH = 0, towerDrawn = false;
  function ensure() {
    var W = stage.clientWidth, H = stage.clientHeight;
    if (!W || !H || (W === builtW && Math.abs(H - builtH) < 40)) return;           /* stage hidden, or nothing changed */
    builtW = W; builtH = H;
    [["pSky", "sky", drawSky], ["pFar", "far", drawFar], ["pMid", "mid", drawMid], ["pFacade", "facade", drawFacade]].forEach(function (p) {
      var el = $(p[0]); if (el && el.tagName === "CANVAS" && !usePlate(p[0], p[1])) p[2](el); });
    var tw = $("pTower"); if (tw && tw.tagName === "CANVAS" && !towerDrawn) { towerDrawn = true; if (!usePlate("pTower", "tower")) drawTower(tw); }
    var fl = $("pFloor"); if (fl && fl.tagName === "CANVAS") { if (plates.floor) usePlate("pFloor", "floor"); else initFloor(fl); }
  }
  var rt = 0;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(ensure, 250); });
  window.addEventListener("hashchange", function () { setTimeout(ensure, 0); });

  /* floor animation: run only while the floor scene is on screen */
  var run = false, last = 0;
  function tick(t) { if (!run) return; var dt = Math.min(.1, (t - last) / 1000); if (dt >= .033) { last = t; floor && floor.frame(dt); } requestAnimationFrame(tick); }
  window.MizanScene = {
    ensure: ensure,
    floor: function (on) { if (on === run) return; run = on; if (on && !reduce.matches) { last = performance.now(); requestAnimationFrame(tick); } else if (on && floor) floor.still(); }
  };
})();
