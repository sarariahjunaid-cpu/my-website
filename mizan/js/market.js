/*
 * MIZAN GROUP FZCO: market ticker (bottom of the hero).
 *
 * Shows REAL quotes fetched from a data source and refreshed automatically; it never invents prices.
 * If no source answers, it shows the pair names only and says the data is unavailable.
 *
 * Sources, in order:
 *   1. MIZAN_CONFIG.market.endpoint: YOUR backend route (recommended for real-time data). It must return JSON:
 *        { "source": "Provider name", "updatedAt": "2026-10-03T10:15:00Z",
 *          "quotes": [ { "symbol": "EUR/USD", "price": 1.0842, "previous": 1.0830 }, ... ] }
 *      Keep the licensed provider's API key on the server. Never put a key in this file.
 *   2. Frankfurter (api.frankfurter.app): European Central Bank daily reference rates, no key, CORS-enabled.
 *      These are published once per working day, so they are NOT real-time and are labelled as such.
 *   3. Gold (XAU/USD), best effort, from api.gold-api.com if reachable. Verify this provider's terms and reliability.
 * Third-party endpoints and their availability are outside our control: verify them before launch.
 */
(function () {
  "use strict";
  var C = window.MIZAN_CONFIG || {}, M = C.market || {}, I = window.MizanI18n;
  var track = document.getElementById("tickerTrack"), noteEl = document.getElementById("tickerNote");
  if (!track) return;
  var tr = I ? I.t : function (s, v) { return v ? s.replace(/\{(\w+)\}/g, function (m, k) { return v[k]; }) : s; };
  var PAIRS = ["EUR/USD", "XAU/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "NZD/USD", "USD/CAD", "EUR/GBP"];
  var FRANK = "https://api.frankfurter.app";
  var state = { quotes: null, source: null, ecbDate: null, updatedAt: null };

  function fmt(n, pair) {
    var d = /JPY|XAU/.test(pair) ? 2 : 4;
    try { return Number(n).toLocaleString(I ? I.locale() : "en-US", { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return Number(n).toFixed(d); }
  }
  function pct(q) {
    if (q.previous == null || !q.previous) return null;
    return (q.price - q.previous) / q.previous * 100;
  }
  function chip(pair, q) {
    var p = pct(q || {}), c = "";
    if (q) {
      if (p !== null) c = '<span class="tk-c ' + (p >= 0 ? "up" : "down") + '"><span aria-hidden="true">' + (p >= 0 ? "▲" : "▼") + "</span> " + (p >= 0 ? "+" : "") + p.toFixed(2).replace(".", I && I.lang() === "nl" ? "," : ".") + "%</span>";
      return '<span class="tk"><span class="tk-p">' + pair + '</span><span class="tk-v">' + fmt(q.price, pair) + "</span>" + c + "</span>";
    }
    return '<span class="tk"><span class="tk-p">' + pair + "</span></span>";
  }
  function render() {
    var items = PAIRS.map(function (p) { return { p: p, q: state.quotes && state.quotes[p] }; });
    var shown = items.filter(function (i) { return i.q; });
    var list = shown.length ? shown : items;                          /* with no data: names only, never made-up numbers */
    var one = list.map(function (i) { return chip(i.p, i.q); }).join("");
    track.innerHTML = one + '<span class="tk-dup" aria-hidden="true">' + one + "</span>";
    track.classList.toggle("nodata", !shown.length);
    if (noteEl) {
      if (!shown.length) noteEl.textContent = tr("Market data unavailable right now. Prices will appear when the data source responds.");
      else if (state.source === "ecb") noteEl.textContent = tr("Market data: ECB daily reference rates via Frankfurter. Not live. Not Mizan Group performance. Not investment advice.") + " " + tr("Latest ECB reference rates, {date}", { date: state.ecbDate || "" });
      else noteEl.textContent = tr("Market data: {source}. Updated {time}. Not Mizan Group performance. Not investment advice.", { source: state.source, time: state.updatedAt ? new Date(state.updatedAt).toLocaleString(I ? I.locale() : "en-US", { dateStyle: "medium", timeStyle: "short" }) : "" });
    }
  }
  function getJSON(url) { return fetch(url, { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }); }

  function fromEndpoint() {
    return getJSON(M.endpoint).then(function (d) {
      var q = {}; (d.quotes || []).forEach(function (x) { if (x && x.symbol && isFinite(x.price)) q[x.symbol] = { price: +x.price, previous: x.previous != null ? +x.previous : null }; });
      if (!Object.keys(q).length) throw new Error("no quotes");
      state = { quotes: q, source: d.source || "market data provider", updatedAt: d.updatedAt || null, ecbDate: null };
    });
  }
  function dayBefore(iso) { var d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); }
  function crossRates(r) {                     /* r: EUR base rates */
    var o = {};
    function set(sym, v) { if (isFinite(v) && v > 0) o[sym] = v; }
    set("EUR/USD", r.USD); set("GBP/USD", r.USD / r.GBP); set("USD/JPY", r.JPY / r.USD); set("USD/CHF", r.CHF / r.USD);
    set("AUD/USD", r.USD / r.AUD); set("NZD/USD", r.USD / r.NZD); set("USD/CAD", r.CAD / r.USD); set("EUR/GBP", r.GBP);
    return o;
  }
  function fromFrankfurter() {
    var to = "USD,GBP,JPY,CHF,AUD,NZD,CAD";
    return getJSON(FRANK + "/latest?from=EUR&to=" + to).then(function (latest) {
      var now = crossRates(latest.rates || {});
      return getJSON(FRANK + "/" + dayBefore(latest.date) + "?from=EUR&to=" + to).then(function (prev) { return crossRates(prev.rates || {}); }, function () { return {}; })
        .then(function (before) {
          var q = {}; Object.keys(now).forEach(function (s) { q[s] = { price: now[s], previous: before[s] || null }; });
          if (!Object.keys(q).length) throw new Error("no rates");
          state = { quotes: q, source: "ecb", ecbDate: latest.date, updatedAt: null };
        });
    });
  }
  function addGold() {
    return getJSON("https://api.gold-api.com/price/XAU").then(function (d) {
      var p = +(d.price != null ? d.price : d.Price);
      if (isFinite(p) && p > 0 && state.quotes) state.quotes["XAU/USD"] = { price: p, previous: null };
    }).catch(function () {});
  }
  function refresh() {
    if (document.hidden) return;
    var p = M.endpoint ? fromEndpoint() : fromFrankfurter().then(addGold);
    p.then(render, function () { if (!state.quotes) render(); });
  }
  /* keep the scene dots and "skip intro" link just above the ticker, whatever its height */
  var tk = document.querySelector(".ticker");
  function sizeVar() { if (tk) document.documentElement.style.setProperty("--tk-h", tk.offsetHeight + "px"); }
  if (tk && "ResizeObserver" in window) new ResizeObserver(sizeVar).observe(tk); else window.addEventListener("resize", sizeVar);
  render(); sizeVar();
  refresh();
  setInterval(refresh, Math.max(30, M.refreshSeconds || 60) * 1000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) refresh(); });
  if (I) I.onChange(render);
})();
