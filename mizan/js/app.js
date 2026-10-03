/*
 * MIZAN GROUP FZCO — front-end behaviour (vanilla JS, no dependencies).
 *
 * DEMO FRONTEND vs PRODUCTION BACKEND
 *   This file contains NO backend. Forms never claim a submission was received unless
 *   MIZAN_CONFIG.endpoints.* is configured and the server answers 2xx.
 *   Investor data is held in memory only and is never written to localStorage/cookies.
 *
 * BACKEND INTEGRATION POINTS
 *   submitInvestment(payload) -> POST MIZAN_CONFIG.endpoints.investmentApplication  (HTTPS, JSON)
 *   submitCall(payload)       -> POST MIZAN_CONFIG.endpoints.callRequest  (or embed Cal.com / Calendly / custom scheduler)
 *   Future services (not implemented): CRM, email notification, KYC/AML provider, document signing,
 *   secure investor database, investor portal.
 *
 * ANALYTICS
 *   track() dispatches a "mizan:track" DOM event and pushes to window.mizanEvents. No third-party
 *   tracker is installed. Wire a consent-aware analytics tool to that event if/when configured.
 */
(function () {
  "use strict";
  var C = window.MIZAN_CONFIG, S = C.strategies, KEYS = Object.keys(S);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  /* ---------- formatting (single place) ---------- */
  var I = window.MizanI18n, tr = I.t, eur = I.eur, years = I.years;
  function ret(k) { return tr("Up to {n}%", { n: S[k].potentialReturn }); }
  function retPA(k) { return tr("Up to {n}% p.a.", { n: S[k].potentialReturn }); }
  function retWords(k) { return tr("Potential return: up to {n}% per year", { n: S[k].potentialReturn }); }
  function retWordsEN(k) { return "Potential return: up to " + S[k].potentialReturn + "% per year"; }   /* English wording kept in the submitted record */
  var ICON = { goldFx: "i-gold", realEstate: "i-re", stable: "i-st" };
  function icon(k, cls) { return '<svg class="' + (cls || "ico") + '" style="color:#0B1B33" aria-hidden="true"><use href="#' + ICON[k] + '"/></svg>'; }

  /* ---------- analytics hook ---------- */
  window.mizanEvents = window.mizanEvents || [];
  function track(name, data) {
    var e = { event: name, data: data || {}, ts: Date.now() };
    window.mizanEvents.push(e);
    try { document.dispatchEvent(new CustomEvent("mizan:track", { detail: e })); } catch (x) {}
  }
  var STRAT_EVT = { goldFx: "gold_fx_selected", realEstate: "real_estate_selected", stable: "stable_selected" };
  function strategySelected(k, source) { track("strategy_selected", { strategy: k, source: source }); track(STRAT_EVT[k], { source: source }); }

  /* ---------- data-bind + disclosure ---------- */
  function bindText() {
    $$("[data-disclosure]").forEach(function (el) { el.textContent = tr(C.disclosure); });
    $$("[data-bind]").forEach(function (el) {
      var p = el.getAttribute("data-bind").split("."), v = S[p[0]][p[1]];
      el.textContent = p[1] === "minimum" ? eur(v) : p[1] === "potentialReturn" ? "up to " + v + "%" : p[1] === "duration" ? years(v) : v;
    });
  }

  /* ---------- cards ---------- */
  function sparkHtml() { return '<canvas class="spark" aria-hidden="true"></canvas><span class="spark-cap">' + esc(tr("Illustrative motion, not market data")) + '</span>'; }
  var CARD_CLASS = { goldFx: "t-gold", realEstate: "t-re", stable: "t-st" };
  function figures(k) {
    return '<dl class="fig"><div><dt>' + esc(tr("From")) + '</dt><dd>' + eur(S[k].minimum) + '</dd></div>' +
      '<div><dt>' + esc(tr("Potential return")) + '</dt><dd>' + esc(retPA(k)) + '</dd></div>' +
      '<div><dt>' + esc(tr("Duration")) + '</dt><dd>' + years(S[k].duration) + '</dd></div></dl>';
  }
  function renderCards() {
    var html = KEYS.map(function (k, i) {
      var s = S[k];
      return '<article class="card ' + CARD_CLASS[k] + '"><span class="no">0' + (i + 1) + '</span>' + icon(k) +
        '<h3>' + esc(tr(s.label)) + '</h3><p class="sub">' + esc(k === "goldFx" ? "Algorithm Trader Premium" : s.name) + '</p>' +
        (k === "goldFx" ? sparkHtml() : "") + figures(k) +
        '<button class="btn btn-primary" type="button" data-open="invest" data-strategy="' + k + '" data-track="card_start_investing">' + esc(tr("Start Investing")) + '</button>' +
        '<button class="btn btn-secondary" type="button" data-open="call" data-strategy="' + k + '" data-track="card_plan_call">' + esc(tr("Plan a call")) + '</button>' +
        '<a class="btn-text" href="#/' + s.slug + '" style="text-align:center;margin-top:6px">' + esc(tr("Details")) + '</a></article>';
    }).join("");
    $$("#cards,[data-cards]").forEach(function (c) { c.innerHTML = html; });
  }

  /* ---------- selector ---------- */
  var selKey = KEYS[0];
  function showSel(k, initial) {
    var box = $("#selectorBox"); if (!box) return; selKey = k;
    $$(".tab", box).forEach(function (b) { var on = b.dataset.k === k; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; });
    var p = $("#selPanel", box), s = S[k];
    p.setAttribute("aria-labelledby", "tab-" + k);
    p.innerHTML = '<div class="top">' + icon(k) + '<div><h3>' + esc(s.name) + '</h3></div></div><p class="lead">' + esc(tr(s.summary)) + '</p>' + (k === "goldFx" ? sparkHtml() : "") +
      '<dl class="stats"><div><dt>' + esc(tr("Minimum investment")) + '</dt><dd>' + eur(s.minimum) + '</dd></div><div><dt>' + esc(tr("Potential annual return")) + '</dt><dd>' + esc(ret(k)) + '</dd></div><div><dt>' + esc(tr("Duration")) + '</dt><dd>' + years(s.duration) + '</dd></div></dl>' +
      '<p class="disc">' + esc(tr(C.disclosure)) + '</p>' +
      '<div class="btn-row"><button class="btn btn-primary" type="button" data-open="invest" data-strategy="' + k + '" data-track="selector_start_investing">' + esc(tr("Start Investing")) + '</button><a class="btn btn-secondary" href="#/' + s.slug + '">' + esc(tr("Details")) + '</a></div>';
    if (window.MizanFx) window.MizanFx.initSparks();
    if (!initial) { p.removeAttribute("data-swap"); void p.offsetWidth; p.setAttribute("data-swap", ""); strategySelected(k, "selector"); }
  }
  function renderSelector() {
    var box = $("#selectorBox"); if (!box) return;
    box.innerHTML = '<div class="tabs" role="tablist" aria-label="' + esc(tr("Strategy")) + '">' + KEYS.map(function (k) {
      return '<button class="tab" role="tab" type="button" id="tab-' + k + '" data-k="' + k + '" aria-selected="' + (k === selKey) + '" aria-controls="selPanel" tabindex="' + (k === selKey ? 0 : -1) + '">' + esc(tr(S[k].label)) + '<span aria-hidden="true">' + (I.lang() === "ar" ? "←" : "→") + '</span></button>';
    }).join("") + '</div><div class="panel" id="selPanel" role="tabpanel" aria-live="polite"></div>';
    if (!box.dataset.bound) {
      box.dataset.bound = "1";
      box.addEventListener("click", function (e) { var b = e.target.closest(".tab"); if (b) showSel(b.dataset.k); });
      box.addEventListener("keydown", function (e) {
        var b = e.target.closest(".tab"); if (!b) return;
        var i = KEYS.indexOf(b.dataset.k), n = null, rtl = I.lang() === "ar";
        if (e.key === (rtl ? "ArrowLeft" : "ArrowRight") || e.key === "ArrowDown") n = (i + 1) % KEYS.length;
        else if (e.key === (rtl ? "ArrowRight" : "ArrowLeft") || e.key === "ArrowUp") n = (i + KEYS.length - 1) % KEYS.length;
        else if (e.key === "Home") n = 0; else if (e.key === "End") n = KEYS.length - 1;
        if (n !== null) { e.preventDefault(); showSel(KEYS[n]); $("#tab-" + KEYS[n]).focus(); }
      });
    }
    showSel(selKey, true);
  }

  /* ---------- comparison (table on desktop, cards on mobile) ---------- */
  function renderCompare() {
    var rows = [[tr("Minimum"), function (k) { return eur(S[k].minimum); }, 0], [tr("Potential annual return"), ret, 0], [tr("Duration"), function (k) { return years(S[k].duration); }, 0], [tr("Approach"), function (k) { return tr(S[k].approach); }, 1]];
    var tbl = '<table class="cmp"><caption class="sr">' + esc(tr("Strategy comparison")) + '</caption><thead><tr><th scope="col"><span class="sr">' + esc(tr("Term")) + '</span></th>' + KEYS.map(function (k) { return '<th scope="col">' + esc(tr(S[k].label)) + '</th>'; }).join("") + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><th scope="row">' + esc(r[0]) + '</th>' + KEYS.map(function (k) { return '<td' + (r[2] ? ' class="txt"' : "") + '>' + esc(r[1](k)) + '</td>'; }).join("") + '</tr>'; }).join("") + '</tbody></table>';
    var c = '<div class="cmp-cards">' + KEYS.map(function (k) {
      return '<div class="cc"><h3>' + esc(tr(S[k].label)) + '</h3><dl>' + rows.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd' + (r[2] ? ' class="txt"' : "") + '>' + esc(r[1](k)) + '</dd></div>'; }).join("") + '</dl></div>';
    }).join("") + '</div>';
    $$("#cmpBox,[data-cmp]").forEach(function (b) { b.innerHTML = tbl + c; });
  }

  /* ---------- process, insights, FAQ ---------- */
  var PROCESS = [["Explore", "Compare Mizan Group investment approaches."], ["Select", "Choose a strategy aligned with your objectives."], ["Apply", "Complete the investor application."], ["Identification & compliance", "Complete applicable identification and compliance checks."], ["Documentation", "Review and execute definitive investment documentation."], ["Funding & registration", "Complete funding and registration according to final terms."]];
  function renderProcess() {
    var h = PROCESS.map(function (p, i) { return '<div class="step"><span class="n">0' + (i + 1) + '</span><h3>' + esc(tr(p[0])) + '</h3><p>' + esc(tr(p[1])) + '</p></div>'; }).join("");
    $$("[data-process]").forEach(function (e) { e.innerHTML = h; });
  }
  var INSIGHTS = [["Dubai Real Estate", "Perspectives on the Dubai property market."], ["Gold Markets", "Context on gold as a market and asset."], ["FX Markets", "Notes on currency markets and volatility."], ["Investment Education", "Plain-language explainers on investing and risk."], ["Mizan Updates", "News and announcements from Mizan Group."]];
  function renderInsights() {
    var h = INSIGHTS.map(function (c) {
      return '<article class="ins"><div class="img"><svg viewBox="0 0 1100 640" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><use href="#i-sky"/></svg></div><div class="b"><span class="tag">' + esc(tr("Category")) + '</span><h3>' + esc(tr(c[0])) + '</h3><p>' + esc(tr(c[1])) + '</p><span class="pill">' + esc(tr("No articles published yet")) + '</span></div></article>';
    }).join("");
    $$("[data-insights]").forEach(function (e) { e.innerHTML = h; });
    /* Demo-only content: shown ONLY when DEMO_CONTENT is true, and conspicuously labelled. */
    if (C.DEMO_CONTENT) {
      $$("[data-demo-slot]").forEach(function (e) {
        e.innerHTML = '<div class="demo"><b>FICTIONAL EXAMPLE — INTERNAL MOCKUP. NOT REAL MEDIA COVERAGE OR REVIEWS.</b><p>Placeholder layout for press and testimonial blocks. Remove before production by setting DEMO_CONTENT = false.</p></div>';
      });
    }
  }
  function faqList() {
    var g = S.goldFx, r = S.realEstate, s = S.stable;
    var docs = tr("Exact conditions are established in the definitive investment documentation.");
    return [
      [tr("What is Mizan Group?"), tr("Mizan Group FZCO is an investment platform offering three investment approaches: Gold FX, Real Estate and Stable. Further company details will be provided here once verified.")],
      [tr("Which investment strategies are available?"), tr("Mizan Group Gold FX Algorithm Trader Premium, Mizan Group Real Estate and Mizan Group Stable.")],
      [tr("What is the minimum investment?"), tr("Gold FX: {a}. Real Estate: {b}. Stable: {c}.", { a: eur(g.minimum), b: eur(r.minimum), c: eur(s.minimum) })],
      [tr("What does “up to X% per year” mean?"), tr("It describes a potential maximum annual return: up to {g}% for Gold FX, up to {r}% for Real Estate and up to {s}% for Stable. It is a ceiling, not an expected or promised result.", { g: g.potentialReturn, r: r.potentialReturn, s: s.potentialReturn })],
      [tr("Are returns guaranteed?"), tr("No.") + " " + tr(C.disclosure)],
      [tr("Can I lose money?"), tr("Yes. You may lose part or all of your invested capital. See the Risks page for details.")],
      [tr("What is Gold FX Algorithm Trader Premium?"), tr(g.description)],
      [tr("What is Mizan Group Real Estate?"), tr(r.description)],
      [tr("What is Mizan Group Stable?"), tr(s.description)],
      [tr("What are the investment durations?"), tr("Gold FX: {a}. Real Estate: {b}. Stable: {c}.", { a: years(g.duration), b: years(r.duration), c: years(s.duration) })],
      [tr("Can I withdraw early?"), tr("Early-withdrawal rights, if any, are not described on this website.") + " " + docs],
      [tr("How does the application process work?"), tr("You explore and select a strategy, complete the investor application, go through identification and compliance checks, review and execute the documentation, then complete funding and registration.")],
      [tr("Which identification / compliance checks apply?"), tr("Applicable identification and compliance checks will be requested during onboarding. The specific requirements depend on the investor and the final terms.")],
      [tr("Which documents will I receive?"), tr("You will receive definitive investment documentation to review and execute. The exact set of documents is confirmed during onboarding.")],
      [tr("How are potential distributions handled?"), tr("Distribution timing and mechanics are not described on this website.") + " " + docs],
      [tr("How is capital repaid?"), tr("Repayment of capital is not guaranteed and depends on the strategy and final terms.") + " " + docs],
      [tr("How can I speak with Mizan Group?"), tr("Use “Plan a call” to request a conversation, or visit the Contact page.")]
    ];
  }
  function renderFaq() {
    var list = faqList();
    $$("[data-faq]").forEach(function (box, bi) {
      var n = box.getAttribute("data-faq"), items = n === "all" ? list : list.slice(0, +n);
      box.innerHTML = items.map(function (q, i) {
        var id = "f" + bi + "-" + i;
        return '<h3><button class="q" type="button" id="q-' + id + '" aria-expanded="false" aria-controls="a-' + id + '">' + esc(q[0]) + '</button></h3><div class="a" id="a-' + id + '" role="region" aria-labelledby="q-' + id + '" hidden>' + esc(q[1]) + '</div>';
      }).join("");
      if (!box.dataset.bound) {
        box.dataset.bound = "1";
        box.addEventListener("click", function (e) {
          var b = e.target.closest("button.q"); if (!b) return;
          var open = b.getAttribute("aria-expanded") === "true";
          b.setAttribute("aria-expanded", String(!open));
          document.getElementById(b.getAttribute("aria-controls")).hidden = open;
        });
      }
    });
  }

  /* ---------- strategy pages ---------- */
  function renderStrategyPages() {
    $$("[data-strategy-page]").forEach(function (v) {
      var k = v.getAttribute("data-strategy-page"), s = S[k];
      v.setAttribute("data-title", s.name + " | Mizan Group FZCO");
      v.setAttribute("data-desc", tr(s.summary) + " " + tr("Potential returns are not guaranteed; investing involves risk."));
      var others = KEYS.filter(function (x) { return x !== k; }).map(function (x) { return '<a class="btn btn-secondary" href="#/' + S[x].slug + '">' + esc(tr(S[x].label)) + '</a>'; }).join("");
      v.innerHTML = '<header class="phead"><div class="wrap"><span class="eyebrow">' + esc(tr("Strategy")) + '</span><h1 tabindex="-1">' + esc(s.name) + '</h1><p class="lead">' + esc(tr(s.summary)) + '</p></div></header>' +
        '<section class="s"><div class="wrap split"><div>' + icon(k, "ico-lg") + '<h2>' + esc(tr(s.label)) + '</h2><p class="lead" style="margin:16px 0">' + esc(tr(s.description)) + '</p><ul class="tick">' + s.points.map(function (p) { return '<li>' + esc(tr(p)) + '</li>'; }).join("") + '</ul>' +
        '<div class="btn-row"><button class="btn btn-primary" type="button" data-open="invest" data-strategy="' + k + '">' + esc(tr("Start Investing")) + '</button><button class="btn btn-secondary" type="button" data-open="call" data-strategy="' + k + '">' + esc(tr("Plan a call")) + '</button></div></div>' +
        '<div class="card ' + CARD_CLASS[k] + '"><span class="no">' + esc(tr("Key terms")) + '</span>' + (k === "goldFx" ? sparkHtml() : "") + figures(k).replace('class="fig"', 'class="fig" style="margin-top:18px"') + '<p class="disc box">' + esc(tr(C.disclosure)) + '</p></div></div></section>' +
        '<section class="s paper"><div class="wrap center"><h2 style="font-size:clamp(24px,3vw,34px)">' + esc(tr("Other strategies")) + '</h2><div class="btn-row" style="justify-content:center;margin-top:22px">' + others + '</div></div></section>';
    });
    $$("[data-terms]").forEach(function (el) {
      el.innerHTML = "<ul>" + KEYS.map(function (k) { return "<li>" + esc(tr("{name}: minimum {min}; potential return up to {r}% per year; duration {d}.", { name: S[k].name, min: eur(S[k].minimum), r: S[k].potentialReturn, d: years(S[k].duration) })) + "</li>"; }).join("") + "</ul>";
    });
  }

  /* ---------- router ---------- */
  var views = $$(".view"), current = null;
  var viewIds = views.map(function (v) { return v.dataset.view; });
  function refreshMeta(v) {
    v = v || $(".view.active"); if (!v) return;
    document.title = v.dataset.title || "Mizan Group FZCO";
    var md = $('meta[name="description"]'); if (md && v.dataset.desc) md.setAttribute("content", v.dataset.desc);
  }
  function route(initial) {
    var h = location.hash.replace(/^#\/?/, ""), parts = h.split("/"), id = parts[0] || "home", anchor = parts[1];
    if (id === "invest") { id = "home"; setTimeout(function () { openInvest(); }, 0); }
    else if (id === "call") { id = "home"; setTimeout(function () { openCall(); }, 0); }
    if (viewIds.indexOf(id) < 0) id = "home";
    var changed = id !== current;
    if (changed) {
      views.forEach(function (v) { v.classList.toggle("active", v.dataset.view === id); });
      var v = $('.view[data-view="' + id + '"]');
      refreshMeta(v);
      $$("[data-nav]").forEach(function (a) { if (a.dataset.nav === id || (id !== "home" && S[KEYS.filter(function (k) { return S[k].slug === id; })[0]] && a.dataset.nav === "strategies")) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
      if (id === "risks") track("risk_page_viewed");
      current = id;
      closeDrawer();
      reveal();
    }
    var target = anchor && document.getElementById(anchor);
    if (target) { target.scrollIntoView(); }
    else if (changed && !initial) { window.scrollTo(0, 0); var hd = $('.view.active h1[tabindex="-1"]'); if (hd) hd.focus({ preventScroll: true }); }
  }
  window.addEventListener("hashchange", function () { route(false); });

  /* ---------- mobile drawer ---------- */
  var burger = $("#burger"), drawer = $("#drawer");
  function syncBurger() { burger.setAttribute("aria-label", tr(burger.getAttribute("aria-expanded") === "true" ? "Close menu" : "Open menu")); }
  function closeDrawer() { burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", tr("Open menu")); drawer.classList.remove("open"); document.body.style.overflow = ""; }
  burger.addEventListener("click", function () {
    var o = burger.getAttribute("aria-expanded") === "true";
    if (o) { closeDrawer(); return; }
    burger.setAttribute("aria-expanded", "true"); burger.setAttribute("aria-label", tr("Close menu")); drawer.classList.add("open"); document.body.style.overflow = "hidden";
  });
  drawer.addEventListener("click", function (e) { if (e.target.closest("a.nl")) closeDrawer(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("open")) { closeDrawer(); burger.focus(); } });
  window.addEventListener("resize", function () { if (window.innerWidth > 1060) closeDrawer(); });

  /* ---------- scroll reveal (content visible by default; see CSS .js .reveal) ---------- */
  var io = null, reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  function reveal() {
    var els = $$(".view.active .reveal:not(.in)");
    if (reduce.matches || !("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    if (!io) io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }); }, { threshold: .08, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (e) { io.observe(e); });
    setTimeout(function () { els.forEach(function (e) { e.classList.add("in"); }); }, 2800); /* safety net */
  }

  /* ---------- dialogs ---------- */
  var opener = null;
  function openDlg(d) { opener = document.activeElement; if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", ""); }
  function closeDlg(d) { if (d.close) d.close(); else d.removeAttribute("open"); }
  ["investDlg", "callDlg"].forEach(function (id) {
    var d = document.getElementById(id);
    d.addEventListener("click", function (e) { if (e.target === d) closeDlg(d); });             // backdrop click
    $("[data-close]", d).addEventListener("click", function () { closeDlg(d); });
    d.addEventListener("close", function () { if (opener && opener.focus) try { opener.focus(); } catch (x) {} if (/^#\/(invest|call)$/.test(location.hash)) history.replaceState(null, "", "#/"); resetDlg(id); });
  });
  function resetDlg(id) { if (id === "investDlg") inv = null; else call = null; }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-track]"); if (t) track(t.getAttribute("data-track"));
    var o = e.target.closest("[data-open]"); if (!o) return;
    e.preventDefault();
    var k = o.getAttribute("data-strategy") || null;
    if (k) strategySelected(k, "cta");
    if (o.dataset.open === "invest") openInvest(k); else openCall(k);
  });

  /* ---------- validation helpers ---------- */
  function setErr(input, msg) {
    var f = input.closest(".field"), p = f && $(".err", f);
    if (f) f.classList.toggle("bad", !!msg);
    if (p) p.textContent = msg || "";
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }
  function reqText(i, msg) { return setErr(i, i.value.trim() ? "" : tr(msg)); }
  function email(i) { var v = i.value.trim(); return setErr(i, !v ? tr("Please enter your email address.") : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : tr("That email address doesn’t look complete.")); }
  function phone(i) { var v = i.value.trim(); return setErr(i, !v ? tr("Please enter your phone number.") : v.replace(/[^\d]/g, "").length >= 7 && /^[+\d][\d\s().\-]+$/.test(v) ? "" : tr("Please enter a valid phone number.")); }
  function parseAmt(v) { return parseInt(String(v).replace(/[^\d]/g, ""), 10) || 0; }
  function stepper(prefix, dlg, total, labels) {
    return function (n) {
      $$(".step-pane", dlg).forEach(function (p) { p.classList.toggle("on", +p.dataset.step === n); });
      $("#" + prefix + "Prog").style.width = Math.min(100, (n - 1) / (total - 1) * 100 + (n === total ? 0 : 0)) + "%";
      $("#" + prefix + "StepLbl").textContent = n <= total ? tr("Step {n} of {total} · {label}", { n: n, total: total, label: tr(labels[n - 1]) }) : "";
      $(".db", dlg).scrollTop = 0;
    };
  }

  /* ---------- START INVESTING ---------- */
  var invDlg = $("#investDlg"), invForm = $("#invForm"), inv = null;
  var INV_LABELS = ["Strategy", "Amount", "Details", "Risk", "Review", "Submit"];
  var invGo = stepper("inv", invDlg, 6, INV_LABELS);
  var RISKS = ["Investing involves risk.", "Potential returns are not guaranteed.", "I can lose part or all of my invested capital.", "Displayed potential returns are not guarantees of future performance.", "Final rights and obligations are governed by the definitive investment documentation."];

  function buildInvOptions() {
    var cur = (document.querySelector('#invStrategies input:checked') || {}).value;
    $("#invStrategies").innerHTML = KEYS.map(function (k) {
      return '<label class="opt"><input type="radio" name="strategy" value="' + k + '"' + (cur === k ? " checked" : "") + '><span><b>' + esc(S[k].name) + '</b>' + esc(tr("From {min} · Potential return: up to {r}% per year · {dur}", { min: eur(S[k].minimum), r: S[k].potentialReturn, dur: years(S[k].duration) })) + '</span></label>';
    }).join("");
  }
  function buildRisks() {
    var was = $$("#invRisks input").map(function (c) { return c.checked; });
    $("#invRisks").innerHTML = RISKS.map(function (r, i) { return '<label class="opt"><input type="checkbox" name="risk' + i + '"' + (was[i] ? " checked" : "") + '><span>' + esc(tr(r)) + '</span></label>'; }).join("");
  }
  buildInvOptions(); buildRisks();

  function openInvest(k) {
    inv = { step: 1, started: false };
    invForm.reset();
    $$(".field", invForm).forEach(function (f) { f.classList.remove("bad"); }); $$(".err", invForm).forEach(function (e) { e.textContent = ""; });
    $("#e-strategy").textContent = ""; $("#e-risk").textContent = ""; $("#amtHint").textContent = "";
    if (k && S[k]) { var r = $('input[name="strategy"][value="' + k + '"]', invForm); if (r) r.checked = true; }
    $("#invFoot").style.display = "";
    syncAmtHelp();
    invGo(1); updInvButtons();
    openDlg(invDlg);
  }
  function selK() { var r = $('input[name="strategy"]:checked', invForm); return r ? r.value : null; }
  function syncAmtHelp() {
    var k = selK(), a = $("#amtHelp");
    a.textContent = k ? tr("The minimum for {label} is {min}.", { label: tr(S[k].label), min: eur(S[k].minimum) }) : tr("Select a strategy first to see its minimum.");
    $("#amount").placeholder = tr("e.g. {n}", { n: I.num(k ? S[k].minimum : 25000) });
  }
  function updInvButtons() {
    $("#invBack").style.visibility = inv.step === 1 ? "hidden" : "visible";
    $("#invNext").textContent = tr(inv.step === 5 ? "Submit application" : "Continue");
  }
  $("#amount").addEventListener("input", function () {
    var v = parseAmt(this.value);
    if (!inv.amountTracked && v) { inv.amountTracked = true; track("investment_amount_entered"); }
    this.value = v ? v.toLocaleString(I.locale()) : "";
    var k = selK(), h = $("#amtHint"); h.classList.remove("warn");
    if (k && v && v < S[k].minimum) { h.textContent = tr("The minimum for {label} is {min}.", { label: tr(S[k].label), min: eur(S[k].minimum) }); h.classList.add("warn"); } else h.textContent = k && v ? tr("Amount meets the minimum.") : "";
    setErr(this, "");
  });
  invForm.addEventListener("change", function (e) {
    if (!inv.started && e.target.name) { inv.started = true; track("investment_form_started"); }
    if (e.target.name === "strategy") { strategySelected(e.target.value, "invest_form"); $("#e-strategy").textContent = ""; syncAmtHelp(); }
  });
  invForm.addEventListener("input", function () { if (inv && !inv.started) { inv.started = true; track("investment_form_started"); } });

  function validInv(n) {
    var ok = true;
    if (n === 1) { ok = !!selK(); $("#e-strategy").textContent = ok ? "" : tr("Please choose a strategy to continue."); }
    if (n === 2) {
      var k = selK(), i = $("#amount"), v = parseAmt(i.value);
      ok = setErr(i, !v ? tr("Please enter an amount.") : v < S[k].minimum ? tr("The minimum for {label} is {min}.", { label: tr(S[k].label), min: eur(S[k].minimum) }) : "");
    }
    if (n === 3) {
      ok = [reqText($("#fn"), "Please enter your first name."), reqText($("#ln"), "Please enter your last name."), email($("#em")), phone($("#ph")), reqText($("#co"), "Please enter your country of residence.")].every(Boolean);
    }
    if (n === 4) { ok = $$('#invRisks input').every(function (c) { return c.checked; }); $("#e-risk").textContent = ok ? "" : tr("Please confirm every statement to continue."); }
    if (!ok) { var f = $(".step-pane.on [aria-invalid='true']", invForm); if (f) f.focus(); }
    return ok;
  }
  function invData() {
    var fd = new FormData(invForm), k = selK();
    return { strategy: k, strategyName: S[k].name, amountEur: parseAmt(fd.get("amount")), minimumEur: S[k].minimum, potentialReturnWording: retWordsEN(k), durationYears: S[k].duration,
      firstName: fd.get("firstName").trim(), lastName: fd.get("lastName").trim(), email: fd.get("email").trim(), phone: fd.get("phone").trim(), country: fd.get("country").trim(),
      investorType: fd.get("investorType"), contactMethod: fd.get("contactMethod"), acknowledgements: RISKS, acknowledgedAt: new Date().toISOString() };
  }
  function renderReview() {
    var d = invData();
    var rows = [[tr("Strategy"), d.strategyName, 1], [tr("Investment amount"), eur(d.amountEur), 2], [tr("Minimum"), eur(d.minimumEur), null], [tr("Potential-return wording"), retWords(d.strategy), null], [tr("Duration"), years(d.durationYears), null],
      [tr("Investor"), d.firstName + " " + d.lastName + " (" + tr(d.investorType) + ")", 3], [tr("Email"), d.email, 3], [tr("Phone"), d.phone, 3], [tr("Country of residence"), d.country, 3], [tr("Preferred contact"), tr(d.contactMethod), 3], [tr("Acknowledgements"), tr("{a} of {b} confirmed", { a: RISKS.length, b: RISKS.length }), 4]];
    $("#invReview").innerHTML = rows.map(function (r) { return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + (r[2] ? ' <button class="edit" type="button" data-edit="' + r[2] + '" aria-label="' + esc(tr("Edit {label}", { label: r[0] })) + '">' + esc(tr("Edit")) + '</button>' : "") + "</dd></div>"; }).join("") +
      '<div><dt>' + esc(tr("Note")) + '</dt><dd style="font-weight:400;font-size:14px;color:#566074">' + esc(tr(C.disclosure)) + "</dd></div>";
  }
  $("#invReview").addEventListener("click", function (e) { var b = e.target.closest("[data-edit]"); if (b) { inv.step = +b.dataset.edit; invGo(inv.step); updInvButtons(); } });
  $("#invBack").addEventListener("click", function () { if (inv.step > 1) { inv.step--; invGo(inv.step); updInvButtons(); } });
  $("#invNext").addEventListener("click", function () {
    if (!validInv(inv.step)) return;
    if (inv.step === 5) { submitInvestment(invData()); return; }
    inv.step++; if (inv.step === 5) renderReview(); invGo(inv.step); updInvButtons();
    if (inv.step === 2) $("#amount").focus();
  });
  invForm.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.tagName !== "BUTTON" && e.target.tagName !== "TEXTAREA") { e.preventDefault(); $("#invNext").click(); } });

  function endState(el, kind, title, body, closeId) {
    el.innerHTML = '<svg class="ok-i" aria-hidden="true"><use href="#i-check"/></svg><h3 tabindex="-1" id="' + closeId + 'H">' + esc(title) + '</h3><p>' + body + '</p><div class="btn-row" style="margin-top:20px"><button class="btn btn-primary" type="button" data-close-dlg="' + closeId + '">' + esc(tr("Close")) + '</button></div>';
    var h = el.querySelector("h3"); if (h) h.focus();
  }
  function post(url, payload) {
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), credentials: "same-origin" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r; });
  }
  function submitInvestment(payload) {
    var url = C.endpoints.investmentApplication, st = $("#invState"), btn = $("#invNext");
    invGo(6); $("#invFoot").style.display = "none";
    st.innerHTML = '<p role="status">' + esc(tr("Preparing your application…")) + '</p>';
    var done = function (live, err) {
      if (err) { st.innerHTML = '<h3>' + esc(tr("We couldn’t send your application")) + '</h3><p>' + tr("Something went wrong and your application was <b>not</b> sent. Please try again, or use Plan a call.") + '</p><div class="btn-row" style="margin-top:20px"><button class="btn btn-primary" type="button" id="invRetry">' + esc(tr("Try again")) + '</button></div>'; $("#invRetry").onclick = function () { submitInvestment(payload); }; return; }
      track("investment_form_completed", { strategy: payload.strategy, live: live });
      if (live) endState(st, "ok", tr("Application received"), tr("Thank you, {name}. Your application for {strategy} has been sent. The next steps are identification and compliance checks, then documentation.", { name: esc(payload.firstName), strategy: esc(payload.strategyName) }), "inv");
      else endState(st, "demo", tr("Application prepared, not submitted"), tr("This website is currently a <b>demo frontend with no backend connected</b>, so your application was <b>not</b> sent to Mizan Group and nothing was stored. To proceed, please use <b>Plan a call</b> or contact Mizan Group directly.") + "<div class=\"note\">Developer: connect <code>endpoints.investmentApplication</code> (POST /api/investment-application) in config.js.</div>", "inv");
    };
    if (!url) { setTimeout(function () { done(false); }, 450); return; }
    post(url, payload).then(function () { done(true); }, function () { done(false, true); });
  }

  /* ---------- PLAN EEN CALL ---------- */
  var callDlg = $("#callDlg"), callForm = $("#callForm"), call = null;
  var TIMES = ["Morning (09:00–12:00)", "Afternoon (12:00–17:00)", "Evening (17:00–20:00)"];
  var callGo = stepper("call", callDlg, 3, ["Details", "Date & time", "Confirmation"]);
  function buildCallOptions() {
    var cur = $("#cst").value || "general", curT = (document.querySelector('input[name="ctime"]:checked') || {}).value;
    $("#cst").innerHTML = KEYS.map(function (k) { return '<option value="' + k + '">' + esc(tr(S[k].label)) + '</option>'; }).join("") + '<option value="general">' + esc(tr("General / Not sure yet")) + '</option>';
    $("#cst").value = cur;
    $("#cTimes").innerHTML = TIMES.map(function (tm, i) { return '<label class="chip"><input type="radio" name="ctime" value="' + esc(tm) + '"' + ((curT ? curT === tm : i === 0) ? " checked" : "") + '><span>' + esc(tr(tm)) + '</span></label>'; }).join("");
  }
  buildCallOptions();
  function openCall(k) {
    call = { step: 1, started: false }; callForm.reset();
    $$(".field", callForm).forEach(function (f) { f.classList.remove("bad"); }); $$(".err", callForm).forEach(function (e) { e.textContent = ""; });
    $("#cst").value = k && S[k] ? k : "general";
    var d = new Date(); d.setDate(d.getDate() + 1); $("#cdate").min = d.toISOString().slice(0, 10);
    $("#callFoot").style.display = ""; callGo(1); updCall(); openDlg(callDlg);
  }
  function updCall() { $("#callBack").style.visibility = call.step === 1 ? "hidden" : "visible"; $("#callNext").textContent = tr(call.step === 2 ? "Request call" : "Continue"); }
  callForm.addEventListener("input", function () { if (call && !call.started) { call.started = true; track("call_form_started"); } });
  callForm.addEventListener("change", function () { if (call && !call.started) { call.started = true; track("call_form_started"); } });
  function validCall(n) {
    var ok = true;
    if (n === 1) ok = [reqText($("#cfn"), "Please enter your first name."), reqText($("#cln"), "Please enter your last name."), email($("#cem")), phone($("#cph"))].every(Boolean);
    if (n === 2) {
      var di = $("#cdate"), dv = di.value, minV = di.min;
      var okD = setErr(di, !dv ? tr("Please choose a preferred date.") : dv < minV ? tr("Please choose a date from tomorrow onward.") : "");
      var okC = $("#cconsent").checked; $("#e-consent").textContent = okC ? "" : tr("Please give consent so we can contact you.");
      ok = okD && okC;
    }
    if (!ok) { var f = $(".step-pane.on [aria-invalid='true']", callForm); if (f) f.focus(); }
    return ok;
  }
  $("#callBack").addEventListener("click", function () { if (call.step > 1) { call.step--; callGo(call.step); updCall(); } });
  $("#callNext").addEventListener("click", function () {
    if (!validCall(call.step)) return;
    if (call.step === 2) { submitCall(); return; }
    call.step++; callGo(call.step); updCall();
  });
  function submitCall() {
    var payload = { firstName: $("#cfn").value.trim(), lastName: $("#cln").value.trim(), email: $("#cem").value.trim(), phone: $("#cph").value.trim(), strategyOfInterest: $("#cst").value,
      preferredDate: $("#cdate").value, preferredTime: ($('input[name="ctime"]:checked') || {}).value, notes: $("#cnotes").value.trim(), consent: true, consentAt: new Date().toISOString() };
    var url = C.endpoints.callRequest, st = $("#callState");
    callGo(3); $("#callFoot").style.display = "none"; st.innerHTML = '<p role="status">' + esc(tr("Preparing your request…")) + '</p>';
    var done = function (live, err) {
      if (err) { st.innerHTML = '<h3>' + esc(tr("We couldn’t send your request")) + '</h3><p>' + tr("Your request was <b>not</b> sent. Please try again.") + '</p><div class="btn-row" style="margin-top:20px"><button class="btn btn-primary" type="button" id="callRetry">' + esc(tr("Try again")) + '</button></div>'; $("#callRetry").onclick = submitCall; return; }
      track("call_form_completed", { strategy: payload.strategyOfInterest, live: live });
      if (live) endState(st, "ok", tr("Call request received"), tr("Thank you, {name}. We have received your request for {date} ({time}). This is a preference; we will confirm an actual time.", { name: esc(payload.firstName), date: esc(payload.preferredDate), time: esc(tr(payload.preferredTime)) }), "call");
      else endState(st, "demo", tr("Request prepared, no appointment booked"), tr("This website is currently a <b>demo frontend with no scheduling backend connected</b>. Nothing was sent and <b>no appointment has been booked</b>. Please contact Mizan Group directly to arrange a call.") + "<div class=\"note\">Developer: connect <code>endpoints.callRequest</code>, or embed Cal.com / Calendly / a custom scheduling API.</div>", "call");
    };
    if (!url) { setTimeout(function () { done(false); }, 450); return; }
    post(url, payload).then(function () { done(true); }, function () { done(false, true); });
  }
  document.addEventListener("click", function (e) { var c = e.target.closest("[data-close-dlg]"); if (c) closeDlg(c.dataset.closeDlg === "inv" ? invDlg : callDlg); });

  /* ---------- hero image hook ---------- */
  if (C.heroImage && $("#heroBg")) { var hb = $("#heroBg"); hb.style.backgroundImage = "url('" + C.heroImage + "')"; var sv = $("svg", hb); if (sv) sv.remove(); }

  /* ---------- dev warnings ---------- */
  if (/[?&]dev=1/.test(location.search) || C.DEMO_CONTENT) { var db = $("#devbar"); if (db) db.hidden = false; }
  if (window.console && console.warn) console.warn("[Mizan] LEGAL RECONCILIATION REQUIRED: the Real Estate Investor Information Memorandum still states €50,000 minimum / 15% / 36 months. Current website terms: €25,000 / up to 14% / 3 years. Update the legal documents before public launch.");

  /* ---------- luxury interactions: scroll progress, pointer ring, card tilt ---------- */
  (function () {
    var root = document.documentElement, tk = false;
    function prog() { tk = false; var h = root.scrollHeight - window.innerHeight; root.style.setProperty("--prog", h > 0 ? Math.min(1, window.pageYOffset / h).toFixed(4) : 0); }
    window.addEventListener("scroll", function () { if (!tk) { tk = true; requestAnimationFrame(prog); } }, { passive: true }); prog();
    var ring = $("#cursor"), fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
    if (ring && fine && !reduce.matches) {
      var rx = 0, ry = 0, tx = 0, ty = 0, run = false;
      function mv() { rx += (tx - rx) * .2; ry += (ty - ry) * .2; ring.style.transform = "translate3d(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px,0)"; if (Math.abs(tx - rx) > .3 || Math.abs(ty - ry) > .3) requestAnimationFrame(mv); else run = false; }
      document.addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; ring.classList.add("on"); if (!run) { run = true; requestAnimationFrame(mv); }
        ring.classList.toggle("big", !!e.target.closest("a,button,.tab,.slab,[data-open]")); }, { passive: true });
      document.addEventListener("pointerleave", function () { ring.classList.remove("on"); });
    }
    document.addEventListener("pointermove", function (e) {
      var c = e.target.closest && e.target.closest(".card"); if (!c || reduce.matches || !fine) return;
      var b = c.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
      c.style.setProperty("--ry", ((x - .5) * 7).toFixed(2) + "deg"); c.style.setProperty("--rx", ((.5 - y) * 5).toFixed(2) + "deg");
      c.style.setProperty("--mx", (x * 100).toFixed(1) + "%"); c.style.setProperty("--my", (y * 100).toFixed(1) + "%");
    }, { passive: true });
    document.addEventListener("pointerout", function (e) { var c = e.target.closest && e.target.closest(".card"); if (c && !c.contains(e.relatedTarget)) { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); } });
  })();

  /* ---------- init ---------- */
  function renderAll() {
    renderCards(); renderSelector(); renderCompare(); renderProcess(); renderInsights(); renderFaq(); renderStrategyPages(); bindText();
    buildInvOptions(); buildRisks(); buildCallOptions(); syncBurger(); refreshMeta();
    if (inv) { invGo(inv.step); updInvButtons(); syncAmtHelp(); if (inv.step === 5) renderReview(); }
    if (call) { callGo(call.step); updCall(); }
    if (window.MizanFx) window.MizanFx.initSparks();
  }
  I.onChange(renderAll);
  renderAll();
  views = $$(".view"); viewIds = views.map(function (v) { return v.dataset.view; });
  I.start();
  route(true);
  if (window.MizanScene) window.MizanScene.ensure();
  if (window.MizanFx) window.MizanFx.init();
})();
