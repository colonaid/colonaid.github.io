/* Colonaid Demo views, part 1 — Diet lists + food search, Ask (AI with built-in fallback). */
(function () {
  const C = window.CA, t = C.t;
  const V = window.Views = window.Views || {};
  const A = () => window.App;
  const esc = (s) => A().esc(s);

  // The AI runs on the viewer's own Claude account; null (e.g. a public-link visitor without Claude) → built-in answers.
  V.sampleP = (window.claude && typeof window.claude.use === "function") ? window.claude.use("sample").catch(() => null) : Promise.resolve(null);

  /* ================= DIET ================= */
  const DIETS = ["none", "veg", "lactoovo", "vegan", "egg"];
  const modsTxt = (f, h) => { const m = C.modsFor(f, h); return m.length ? '<span class="mods">' + esc(m.map((x) => t("mod." + x)).join(" · ")) + "</span>" : ""; };

  function dayNote(h, day) {
    if (day !== 3) return "";
    const time = A().state.profile.time || "";
    let html = A().note("info", esc(t("diet.day3Note")));
    if (h.dayBefore === "cgh") html += A().note("warn", [t("meal.b") + ": " + t("db.cgh.b"), t("meal.l") + ": " + t("db.cgh.l"), t("meal.d") + ": " + t("db.cgh.d"), t("db.cgh.note")].map(esc).join("<br>"));
    else if (h.dayBefore === "parkway") html += A().note("warn", esc(t("db.parkway")) + "<br>" + esc(t("db.parkwayTime")));
    else if (h.dayBefore === "sgh") html += A().note("warn", esc(t("db.sgh")));
    else if (h.dayBefore === "skh") html += A().note("warn", esc(t("db.skh")));
    else if (h.dayBefore === "nuh") html += A().note("warn", esc(t("db.nuh.am2")) + "<br>" + esc(t("db.nuh.pm2")));
    else html += A().note("warn", esc(t("db.baseline")));
    return html;
  }
  const ICO_CAN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 13l4 4 8-9"/><path d="M11 16l1.5 1.5L22 8"/></svg>';
  const ICO_NO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg>';
  function catCard(cat, L) {
    const can = L.can, avoid = L.avoid;
    return '<section class="dcat"><h2>' + esc(t("cat." + cat)) + "</h2>" +
      '<h3 class="dcan">' + ICO_CAN + esc(t("diet.can")) + "</h3>" +
      (can.length ? '<div class="dchips">' + can.map((x) => '<span class="dchip can">' + esc(C.foodName(x.food)) + (x.lowfat ? " · " + esc(t("chk.lowfat").split("—").pop().trim()) : "") + "</span>").join("") + "</div>" : '<p class="dnone">' + esc(t("diet.noneAllowed")) + "</p>") +
      '<hr><h3 class="dno">' + ICO_NO + esc(t("diet.cannot")) + "</h3>" +
      (avoid.length ? '<div class="dchips">' + avoid.map((x) => '<span class="dchip no" title="' + esc(t(x.reason)) + '">' + esc(C.foodName(x.food)) + "</span>").join("") + "</div>" : '<p class="dnone">' + esc(t("diet.noneAvoid")) + "</p>") +
      "</section>";
  }
  function listsHtml(h, pref, day, cat) {
    const cats = cat && cat !== "all" ? [cat] : C.CATS;
    let nCan = 0, nAvoid = 0;
    const cards = cats.map((c) => { const L = C.dietList(h, pref, day, c); nCan += L.can.length; nAvoid += L.avoid.length; return catCard(c, L); }).join("");
    return '<p class="dsummary">' + esc(t("diet.summary", { can: nCan, avoid: nAvoid })) + "</p>" + cards;
  }

  function checkResults(q) {
    const s = A().state, h = A().hosp();
    if (!q || q.trim().length < 2) return "";
    const res = C.checkFood(q, h, C.prefProfile(s.dietPref));
    if (!res.length) return '<div class="check-item"><p>' + esc(t("checker.none2")) + '</p><button type="button" class="btn ghost" data-askai="' + esc(q) + '">' + esc(t("checker.askAi")) + "</button></div>";
    return res.map((r) => {
      let pill, reason = "";
      if (r.excl) pill = '<span class="pill no">' + esc(t(r.excl === "allergy" ? "chk.allergy" : "chk.notYou")) + "</span>";
      else if (r.status === "yes") pill = '<span class="pill yes">' + esc(t("chk.yes")) + "</span>";
      else if (r.status === "lowfat") pill = '<span class="pill yes">' + esc(t("chk.lowfat")) + "</span>";
      else if (r.status === "no") { pill = '<span class="pill no">' + esc(t("chk.no")) + "</span>"; reason = t(r.food.why ? "why." + r.food.why : "why.ruleNo"); }
      else { pill = '<span class="pill ask">' + esc(t("chk.notListed")) + "</span>"; reason = t("why.ruleAsk2"); }
      const ok = !r.excl && (r.status === "yes" || r.status === "lowfat");
      return '<div class="check-item"><div class="row" style="justify-content:space-between"><b>' + esc(C.foodName(r.food)) + "</b>" + pill + "</div>" +
        (reason ? '<span class="small muted">' + esc(reason) + "</span>" : "") + (ok ? modsTxt(r.food, h) : "") +
        (ok ? '<span class="tiny">' + esc(t(r.clearOk ? "chk.clearOk" : "chk.clearNo")) + "</span>" : "") + "</div>";
    }).join("");
  }

  function prepDays(d0) {                                   // only today's and upcoming prep days
    const today = C.iso(C.today());
    return [1, 2, 3].map((d) => ({ d, date: C.addDays(d0, d - 4) })).filter((x) => C.iso(x.date) >= today);
  }
  V.diet = function () {
    const s = A().state, h = A().hosp(), pref = s.dietPref = s.dietPref || {};
    const d0 = C.parseDate(s.profile.date), days = prepDays(d0);
    if (pref.day && !days.some((x) => x.d === pref.day)) delete pref.day;       // a chosen day that has passed
    const dayBtns = days.map((x) => '<button type="button" class="chip" data-pday="' + x.d + '" aria-pressed="' + (pref.day === x.d) + '">' + esc(t("diet.day" + x.d)) + " <small>" + esc(C.fmtDate(x.date, { day: "numeric", month: "short" })) + "</small></button>").join("");
    const cat = pref.cat || "all";
    const notes = [];
    if (h.status === "pending") notes.push(A().note("warn", esc(t("st.pending"))));
    if (h.lrDays > 3) notes.push(A().note("info", esc(t("diet.note5"))));
    if ((window.CA_RULESETS[h.rules] || {}).dairy === "lowfat") notes.push(A().note("info", esc(t("diet.dairyLowfat"))));
    if (pref.halal) notes.push(A().note("info", esc(t("diet.halalNote"))));
    const q = s.chkQ || "";
    return '<div class="stack"><h1>' + esc(t("diet.listTitle")) + '</h1><p class="muted">' + esc(t("diet.sub", { hospital: h.name })) + "</p></div>" +
      '<section class="panel"><p class="lead-prompt">' + esc(t("diet.prompt")) + "</p>" +
        '<fieldset><legend>' + esc(t("diet.prepDay")) + "</legend>" + (days.length ? '<div class="chips">' + dayBtns + "</div>" : '<p class="tiny">' + esc(t("diet.noDays")) + "</p>") + "</fieldset>" +
        '<label class="f">' + esc(t("diet.pref")) + '<select class="inp" id="prefDiet"><option value="">' + esc(t("diet.prefPh")) + "</option>" + DIETS.map((x) => '<option value="' + x + '"' + (pref.diet === x ? " selected" : "") + ">" + esc(t("d." + x)) + "</option>").join("") + "</select></label>" +
        '<div class="chips"><label class="chip"><input type="checkbox" id="prefHalal"' + (pref.halal ? " checked" : "") + "> " + esc(t("f.halal")) + '</label><label class="chip"><input type="checkbox" id="prefGf"' + (pref.gf ? " checked" : "") + "> " + esc(t("f.gf")) + "</label></div>" +
        '<label class="f">' + esc(t("diet.cat")) + '<select class="inp" id="prefCat">' + ["all"].concat(C.CATS).map((c) => '<option value="' + c + '"' + (cat === c ? " selected" : "") + ">" + esc(t("cat." + c)) + "</option>").join("") + "</select></label>" +
      "</section>" +
      notes.join("") + dayNote(h, pref.day) +
      '<div class="dlists">' + listsHtml(h, pref, pref.day, cat) + "</div>" +
      '<section class="panel" id="checker"><h2>' + esc(t("checker.title")) + '</h2><input class="inp" id="chk" type="search" autocomplete="off" placeholder="' + esc(t("checker.ph")) + '" value="' + esc(q) + '"><div class="check-result" id="chkRes">' + checkResults(q) + "</div></section>" +
      '<section class="panel wash"><h3>' + esc(t("diet.whyTitle")) + '</h3><ul class="why-list">' + ["why.lr", "why.colourRule"].concat(C.clearOnlyDay(h) ? ["why.clear"] : [], ["why.purg"]).map((k) => "<li>" + esc(t(k)) + "</li>").join("") + "</ul></section>";
  };
  V.bindDiet = function (root) {
    const s = A().state, pref = s.dietPref;
    const upd = () => { A().save(); const y = window.scrollY; A().render(); window.scrollTo(0, y); };
    root.onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.pday) { pref.day = pref.day === +b.dataset.pday ? undefined : +b.dataset.pday; upd(); }
      else if (b.dataset.askai) { s.pendingAsk = b.dataset.askai; A().go("ask"); }
    };
    root.querySelector("#prefDiet").addEventListener("change", (e) => { pref.diet = e.target.value; upd(); });
    root.querySelector("#prefHalal").addEventListener("change", (e) => { pref.halal = e.target.checked; upd(); });
    root.querySelector("#prefGf").addEventListener("change", (e) => { pref.gf = e.target.checked; upd(); });
    const catSel = root.querySelector("#prefCat"); catSel.addEventListener("change", (e) => { pref.cat = e.target.value; upd(); });
    const inp = root.querySelector("#chk");
    inp.addEventListener("input", () => { s.chkQ = inp.value; root.querySelector("#chkRes").innerHTML = checkResults(inp.value); });
    if (s.dietFocusChecker) { s.dietFocusChecker = false; root.querySelector("#checker").scrollIntoView({ block: "start" }); inp.focus(); }
  };

  /* ================= ASK ================= */
  let busy = false, ctl = null;
  const clean = (x) => String(x || "").replace(/\*\*|__|^#+\s*/gm, "");
  function logHtml() {
    const s = A().state;
    const greet = '<div class="bubble bot">' + esc(t("ask.greet", { name: C.firstName(s.profile.name), hospital: A().hospLabel() })) + "</div>";
    return greet + s.chat.map((m) => '<div class="bubble ' + (m.role === "user" ? "me" : "bot") + '">' + esc(clean(m.content)) + (m.local ? '<span class="src">' + esc(t("la.src")) + "</span>" : "") + "</div>").join("");
  }
  V.ask = function () {
    const faqs = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => '<button type="button" class="chip" data-faq="' + i + '">' + esc(t("faq" + i)) + "</button>").join("");
    return '<div class="stack"><h1>' + esc(t("ask.title")) + '</h1><p class="muted">' + esc(t("ask.sub", { hospital: A().hosp().name })) + "</p></div>" +
      '<section class="panel wash"><span class="eyebrow">' + esc(t("ask.faq")) + '</span><div class="chips">' + faqs + "</div></section>" +
      '<section class="panel"><div class="chat" id="chatLog">' + logHtml() + "</div>" +
        '<form class="composer" id="askForm"><input class="inp" id="askInp" autocomplete="off" placeholder="' + esc(t("ask.ph")) + '"><button class="btn" id="askBtn" type="submit">' + esc(t("ask.send")) + "</button></form>" +
        '<div class="row" style="justify-content:flex-end"><button type="button" class="linkbtn" data-act="clear">' + esc(t("ask.clear")) + "</button></div>" +
        '<p class="disclaimer">' + A().ICON.info + "<span>" + esc(t("ask.disclaimer")) + "</span></p>" +
      "</section>";
  }
  async function send(root, text, faq) {
    const s = A().state; text = (text || "").trim();
    if (!text || busy) return;
    busy = true;
    const log = root.querySelector("#chatLog"), btn = root.querySelector("#askBtn");
    s.chat.push({ role: "user", content: text });
    log.insertAdjacentHTML("beforeend", '<div class="bubble me">' + esc(text) + "</div>");
    const bubble = document.createElement("div"); bubble.className = "bubble bot"; bubble.textContent = t("ask.thinking"); log.appendChild(bubble);
    bubble.scrollIntoView({ block: "nearest" });
    const local = () => {                                   // built-in answer from the hospital knowledge base
      const ans = C.localAnswer(text, s, faq);
      bubble.innerHTML = esc(ans) + '<span class="src">' + esc(t("la.src")) + "</span>";
      s.chat.push({ role: "assistant", content: ans, local: true }); A().save();
    };
    btn.textContent = t("ask.stop"); btn.type = "button"; btn.onclick = () => ctl && ctl.abort();
    try {
      const sample = await V.sampleP;
      if (!sample) { local(); return; }
      ctl = new AbortController();
      const merged = Object.assign({}, s, { profile: Object.assign({}, s.profile, C.prefProfile(s.dietPref)) });
      const turns = [{ role: "user", content: C.chatRules(merged) }].concat(s.chat.filter((m) => !m.local).slice(-12).map((m) => ({ role: m.role, content: m.content })));
      if (turns[turns.length - 1].role !== "user") turns.push({ role: "user", content: text });
      const res = await sample(turns, { cache: false, signal: ctl.signal, modelTier: "default", onText: ({ text: tx }) => { bubble.textContent = clean(tx); } });
      bubble.textContent = clean(res.text);
      s.chat.push({ role: "assistant", content: res.text }); A().save();
    } catch (e) {
      if (e && e.code === "cancelled" && e.text) { s.chat.push({ role: "assistant", content: e.text }); bubble.textContent = clean(e.text); A().save(); }
      else local();                                          // declined, rate-limited, unavailable → still answer
    } finally {
      busy = false; ctl = null;
      btn.textContent = t("ask.send"); btn.type = "submit"; btn.onclick = null;
    }
  }
  V.bindAsk = function (root) {
    const s = A().state;
    root.querySelector("#askForm").addEventListener("submit", (e) => { e.preventDefault(); const i = root.querySelector("#askInp"); const v = i.value; i.value = ""; send(root, v); });
    root.onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.faq) send(root, t("faq" + b.dataset.faq), +b.dataset.faq);
      else if (b.dataset.act === "clear") { s.chat = []; A().save(); root.querySelector("#chatLog").innerHTML = logHtml(); }
    };
    if (s.pendingAsk) { const q = s.pendingAsk; s.pendingAsk = null; send(root, q); }
  };
})();
