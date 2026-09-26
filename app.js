/* Colonaid Demo — UI core: phone login, short profile, home, navigation. Feature views live in views.js / views2.js. */
(function () {
  const C = window.CA, t = C.t;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Demo numbers (fictional). In the live app patients type their own number instead.
  const DEMO_PHONES = ["+65 8100 0001", "+65 8100 0002", "+65 8100 0003", "+65 8100 0004", "+65 8100 0005", "+65 8100 0006"];

  const fresh = () => ({ profile: null, purg: { lead: "30", split: true, ticks: {} }, ready: {}, chat: [], lang: "en", tab: "home", draft: null, dietPref: {} });
  let user = C.getSession();
  let state;
  let pending = null;           // { phone, code } while the OTP screen is open
  function loadUser() {
    C.setUser(user || "anon");
    const uiLang = state ? state.lang : null;
    state = Object.assign(fresh(), (user && C.load()) || {});
    if (!state.profile && uiLang) state.lang = uiLang;
    C.setLang(state.lang);
  }
  loadUser();

  const ICON = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
    diet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12h18a9 9 0 0 1-18 0z"/><path d="M8 8c0-2 2-2 2-4M13 8c0-2 2-2 2-4"/></svg>',
    ask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4.8 1c0 1.7-2.3 2-2.3 3.5M12 17h.01"/></svg>',
    purge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg>',
    ready: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="5"/><circle cx="12" cy="7" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="17" r="1.6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>'
  };
  const TABS = ["home", "diet", "ask", "purge", "ready"];

  const App = window.App = {
    get state() { return state; }, get user() { return user; }, esc, t, ICON,
    save() { if (user) C.save(state); },
    go(tab) { state.tab = tab; App.save(); render(); window.scrollTo(0, 0); },
    render: () => render(),
    toast(msg) { const el = document.getElementById("toast"); el.textContent = msg; el.hidden = false; clearTimeout(App._tt); App._tt = setTimeout(() => (el.hidden = true), 2400); },
    hosp() { return C.hospital(state.profile.hospital); },
    hospLabel() { return C.shortHospital(App.hosp()); },
    statusPill(h) {
      const cls = h.status === "verified" ? "yes" : h.status === "group" ? "blue" : "ask";
      const txt = h.status === "verified" ? t("st.verified") : h.status === "group" ? t("st.group2") : t("st.pending").split(" — ")[0].split("—")[0];
      return '<span class="pill ' + cls + '">' + esc(txt) + "</span>";
    },
    note(kind, html) { return '<div class="note ' + kind + '">' + (kind === "info" ? ICON.info : ICON.warn) + "<div>" + html + "</div></div>"; }
  };

  /* ---------------- shell ---------------- */
  const view = document.getElementById("view");
  const langSel = document.getElementById("langSel");
  const profileBtn = document.getElementById("profileBtn");
  const tabs = document.getElementById("tabs");

  langSel.addEventListener("change", () => {
    if (document.getElementById("pform")) captureDraft();
    state.lang = langSel.value; C.setLang(state.lang);
    if (state.profile) state.profile.lang = state.lang;
    App.save(); render();
  });
  profileBtn.addEventListener("click", () => { state.draft = null; App.go("profile"); });
  tabs.addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) App.go(b.dataset.tab); });

  function renderTabs() {
    document.getElementById("tabsInner").innerHTML = TABS.map((k) =>
      '<button class="tab" type="button" data-tab="' + k + '"' + (state.tab === k ? ' aria-current="page"' : "") + ">" + ICON[k] + "<span>" + esc(t("nav." + k)) + "</span></button>").join("");
  }

  function render() {
    langSel.value = state.lang;
    profileBtn.setAttribute("aria-label", t("hdr.profile"));
    const inApp = !!(user && state.profile);
    profileBtn.hidden = !inApp;
    tabs.hidden = !inApp || state.tab === "profile";
    view.onclick = null;
    if (!user) { view.innerHTML = pending ? renderOtp() : renderLogin(); pending ? bindOtp() : bindLogin(); return; }
    if (!state.profile || state.tab === "profile") { view.innerHTML = renderForm(!!state.profile); bindForm(!!state.profile); return; }
    renderTabs();
    const V = window.Views;
    const fn = { home: renderHome, diet: V.diet, ask: V.ask, purge: V.purge, ready: V.ready }[state.tab] || renderHome;
    view.innerHTML = fn() + '<p class="foot">' + esc(t("footer")) + "</p>";
    const binder = { home: bindHome, diet: V.bindDiet, ask: V.bindAsk, purge: V.bindPurge, ready: V.bindReady }[state.tab] || bindHome;
    binder(view);
  }

  /* ---------------- login + one-time code ---------------- */
  function renderLogin() {
    return '<section class="hero"><div class="ring"></div><span class="eyebrow" style="color:#BFD3FF">Colonaid</span><h1>' + esc(t("login.title")) + "</h1><p>" + esc(t("login.sub")) + "</p></section>" +
      '<section class="panel"><label class="f">' + esc(t("login.phone")) + '<div class="composer"><input class="inp" id="loginPhone" type="tel" placeholder="+65 ···· ····" disabled><button class="btn" type="button" disabled>' + esc(t("login.send")) + "</button></div></label>" +
        '<p class="tiny">' + esc(t("login.demoNote")) + "</p></section>" +
      '<section class="stack"><span class="eyebrow">' + esc(t("login.demo")) + '</span><div class="demo-phones">' +
        DEMO_PHONES.map((p, i) => '<button type="button" class="demo-phone" data-phone="' + esc(p) + '">' + ICON.phone + "<span><b>" + esc(p) + "</b><small>Demo " + (i + 1) + "</small></span></button>").join("") +
      "</div></section>";
  }
  function bindLogin() {
    view.onclick = (e) => {
      const b = e.target.closest("[data-phone]"); if (!b) return;
      pending = { phone: b.dataset.phone, code: String(Math.floor(100000 + Math.random() * 900000)) };
      render();
    };
  }
  function renderOtp() {
    return '<button type="button" class="btn line" data-act="change" style="align-self:flex-start">← ' + esc(t("otp.change")) + "</button>" +
      '<div class="sms" role="status"><span class="sms-from">SMS · Colonaid</span>' + esc(t("otp.demoSms", { code: pending.code })) + "</div>" +
      '<form class="panel" id="otpForm"><h1>' + esc(t("otp.title")) + '</h1><p class="muted">' + esc(t("otp.sent", { phone: pending.phone })) + "</p>" +
        '<label class="f">' + esc(t("otp.label")) + '<input class="inp otp" id="otpInp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]*"></label>' +
        '<p id="otpErr" class="note bad" hidden>' + esc(t("otp.wrong")) + "</p>" +
        '<button class="btn block" type="submit">' + esc(t("otp.verify")) + '</button><button type="button" class="linkbtn" data-act="resend">' + esc(t("otp.resend")) + "</button></form>";
  }
  function bindOtp() {
    const inp = view.querySelector("#otpInp"); inp.focus();
    view.onclick = (e) => {
      const b = e.target.closest("[data-act]"); if (!b) return;
      if (b.dataset.act === "change") { pending = null; render(); }
      if (b.dataset.act === "resend") { pending.code = String(Math.floor(100000 + Math.random() * 900000)); render(); }
    };
    view.querySelector("#otpForm").addEventListener("submit", (e) => {
      e.preventDefault();
      if (inp.value.trim() !== pending.code) { view.querySelector("#otpErr").hidden = false; return; }
      user = pending.phone; pending = null; C.setSession(user); loadUser(); render(); window.scrollTo(0, 0);
    });
  }

  /* ---------------- profile: language, name, date, hospital ---------------- */
  const FIELDS = ["name", "date", "hospital"];
  function captureDraft() {
    const f = document.getElementById("pform"); if (!f) return;
    const d = {}; FIELDS.forEach((k) => { d[k] = f.elements[k].value; }); state.draft = d;
  }
  function renderForm(edit) {
    const d = state.draft || (edit ? state.profile : {}) || {};
    const v = (k) => esc(d[k] || "");
    const hs = window.CA_HOSPITALS;
    const hOpts = (type, label) => '<optgroup label="' + esc(label) + '">' + hs.filter((h) => h.type === type).map((h) => '<option value="' + h.id + '"' + (d.hospital === h.id ? " selected" : "") + ">" + esc(h.name) + "</option>").join("") + "</optgroup>";
    const curH = d.hospital ? C.hospital(d.hospital) : null;
    const langCards = C.LANGS.map((l) => '<button type="button" class="lang-card" data-lang="' + l + '" aria-pressed="' + (state.lang === l) + '">' + esc(window.CA_I18N[l]["lang.name"]) + "<small>" + esc({ en: "English", zh: "Mandarin", ms: "Malay", ta: "Tamil" }[l]) + "</small></button>").join("");
    return (edit ? '<div class="row"><button type="button" class="btn line" data-act="back">← ' + esc(t("c.back")) + '</button></div><h1>' + esc(t("pf.title")) + "</h1>"
      : '<section class="hero"><div class="ring"></div><span class="eyebrow" style="color:#BFD3FF">' + esc(user) + "</span><h1>" + esc(t("pf.setup")) + "</h1><p>" + esc(t("pf.setupSub")) + "</p></section>") +
      '<section class="panel"><h2>' + esc(t("lang.choose")) + '</h2><div class="lang-grid">' + langCards + "</div></section>" +
      '<form id="pform" class="panel" novalidate>' +
        '<label class="f">' + esc(t("f.name")) + '<input class="inp" id="f-name" name="name" autocomplete="name" value="' + v("name") + '"></label>' +
        '<label class="f">' + esc(t("f.date")) + '<input class="inp" id="f-date" name="date" type="date" value="' + v("date") + '"></label>' +
        '<label class="f">' + esc(t("f.hospital")) + '<select class="inp" id="f-hospital" name="hospital"><option value="">' + esc(t("f.hospitalPh")) + "</option>" +
          hOpts("public", t("f.public")) + hOpts("private", t("f.private")) + hOpts("other", "—") + "</select></label>" +
        '<div id="hstatus">' + (curH ? App.statusPill(curH) : "") + "</div>" +
        '<p id="ferr" class="note bad" hidden>' + esc(t("err.required")) + "</p>" +
        '<button class="btn block" type="submit">' + esc(t(edit ? "ob.update" : "ob.save")) + "</button>" +
        '<p class="tiny">' + esc(t("ob.privacy")) + "</p>" +
      "</form>" +
      (edit ? '<div class="row"><button type="button" class="btn line" data-act="logout">' + esc(t("logout")) + '</button><button type="button" class="btn danger" data-act="reset">' + esc(t("pf.reset")) + "</button></div>" : '<button type="button" class="btn line" data-act="logout">' + esc(t("logout")) + "</button>");
  }
  function bindForm(edit) {
    const f = document.getElementById("pform");
    view.onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.lang) { captureDraft(); state.lang = b.dataset.lang; C.setLang(state.lang); if (state.profile) state.profile.lang = state.lang; App.save(); render(); }
      else if (b.dataset.act === "back") { state.draft = null; App.go("home"); }
      else if (b.dataset.act === "logout") { App.save(); user = null; C.setSession(null); loadUser(); render(); window.scrollTo(0, 0); }
      else if (b.dataset.act === "reset") {
        if (b.dataset.armed) { C.wipe(); const l = state.lang; state = Object.assign(fresh(), { lang: l }); render(); }
        else { b.dataset.armed = "1"; b.textContent = t("pf.resetConfirm"); }
      }
    };
    f.elements.hospital.addEventListener("change", () => {
      const id = f.elements.hospital.value; document.getElementById("hstatus").innerHTML = id ? App.statusPill(C.hospital(id)) : "";
    });
    f.addEventListener("submit", (e) => {
      e.preventDefault(); captureDraft(); const d = state.draft;
      if (!d.name.trim() || !d.date || !d.hospital) { document.getElementById("ferr").hidden = false; return; }
      state.profile = Object.assign({}, state.profile || {}, d, { lang: state.lang });
      state.draft = null; state.tab = "home"; App.save(); render(); window.scrollTo(0, 0);
    });
  }

  /* ---------------- home ---------------- */
  function renderHome() {
    const p = state.profile, h = App.hosp(), n = C.daysUntil(p.date), d0 = C.parseDate(p.date);
    let count;
    if (n > 1) count = '<h2 class="countdown">' + esc(t("home.countdown", { n: "§" })).replace("§", '<span class="num">' + n + "</span>") + "</h2>";
    else if (n === 1) count = "<h2>" + esc(t("home.tomorrow")) + "</h2>";
    else if (n === 0) count = "<h2>" + esc(t("home.isToday")) + "</h2>";
    else count = "<h2>" + esc(t("home.past")) + "</h2>";
    const startsLine = n > 3 ? '<p class="muted">' + esc(t("home.starts", { date: C.fmtDate(C.addDays(d0, -3), { weekday: "long", day: "numeric", month: "long" }) })) + "</p>" : "";
    const todayIso = C.iso(C.today());
    const rows = [[3, "tl.lr"], [2, "tl.lr"], [1, "tl.dayBefore"], [0, "tl.dayOf"]].map(([off, key]) => {
      const d = C.addDays(d0, -off), isNow = C.iso(d) === todayIso, isPast = C.iso(d) < todayIso;
      const sub = off === 0 ? t("diet.dayLabel0") : t("diet.day" + (4 - off));
      return '<div class="tl-row' + (isNow ? " now" : isPast ? " past" : "") + '"><div class="tl-date"><b>' + esc(C.fmtDate(d, { day: "numeric", month: "short" })) + "</b>" + esc(C.fmtDate(d, { weekday: "short" })) + '</div><div class="tl-rail"><i></i><u></u></div><div class="tl-body"><h3>' + esc(t(key)) + (isNow ? ' <span class="pill blue">' + esc(t("tl.todayTag")) + "</span>" : "") + '</h3><p class="small muted">' + esc(sub) + "</p></div></div>";
    }).join("");
    const nd = C.nextDose(state.purg || {});
    const doseCard = nd ? '<button type="button" class="next-dose" data-go="purge" style="border:0;text-align:left"><span><span class="small" style="color:#DCE7FF">' + esc(t("home.nextDose")) + " · " + esc(t(nd.label)) + "</span><br><b>" + esc(C.fmtDateTime(nd.at)) + "</b></span>" + ICON.purge.replace("<svg", '<svg width="28" height="28"') + "</button>" : "";
    return '<section class="welcome"><p class="lead">' + esc(t("welcome", { name: C.firstName(p.name) })) + "</p>" + count + startsLine + "</section>" + doseCard +
      '<section class="panel"><h2>' + esc(t("home.timeline")) + '</h2><div class="timeline">' + rows + "</div></section>";
  }
  function bindHome(root) {
    root.onclick = (e) => { const b = e.target.closest("[data-go]"); if (b) { if (b.dataset.go === "diet") state.dietFocusChecker = true; App.go(b.dataset.go); } };
  }

  if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", render); else setTimeout(render, 0);
})();
