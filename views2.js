/* Colonaid Demo views, part 2 — Purgative & WhatsApp reminders, Readiness (date-locked, with reference pictures). */
(function () {
  const C = window.CA, t = C.t;
  const V = window.Views = window.Views || {};
  const A = () => window.App;
  const esc = (s) => A().esc(s);

  /* ================= PURGATIVE ================= */
  // Dose and timing always come from the patient's own prescription — Colonaid never pre-fills them.
  const PRODUCTS = ["PEG-ES (colonic lavage powder)", "Klean-Prep", "Fortrans", "Moviprep", "Plenvu", "Picoprep / Pico-Salax"];
  function untilText(d) {
    const ms = d.getTime() - Date.now();
    if (ms <= 0) return t("pg.now");
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
    return t("pg.in", { t: (h >= 24 ? Math.floor(h / 24) + "d " + (h % 24) + "h" : h + "h " + m + "m") });
  }
  function glassesHtml(pg) {
    return C.doses(pg).filter((d) => d.glasses > 0).map((d) => {
      const ticks = (pg.ticks && pg.ticks[d.key]) || [];
      const done = ticks.filter(Boolean).length;
      return '<div class="stack"><div class="row" style="justify-content:space-between"><b>' + esc(t(d.label)) + '</b><span class="small muted">' + esc(t("pg.glasses", { done, total: d.glasses })) + '</span></div><div class="glasses">' +
        Array.from({ length: Math.min(d.glasses, 24) }, (_, i) => '<button type="button" class="glass" data-glass="' + d.key + ":" + i + '" aria-pressed="' + !!ticks[i] + '" aria-label="' + (i + 1) + '"><span>' + (i + 1) + "</span></button>").join("") + "</div></div>";
    }).join("");
  }
  V.purge = function () {
    const s = A().state, pg = s.purg = s.purg || { lead: "30", split: true, ticks: {} };
    const nd = C.nextDose(pg);
    const known = PRODUCTS.includes(pg.product);
    const f = (label, input) => '<label class="f">' + esc(label) + input + "</label>";
    const doseFields = (n) => '<fieldset class="panel wash"><legend>' + esc(t("pg.dose" + n)) + "</legend>" +
      f(t("pg.when"), '<input class="inp" id="pg-d' + n + '" data-pg="d' + n + '" type="datetime-local" value="' + esc(pg["d" + n] || "") + '">') +
      f(t("pg.amount"), '<textarea class="inp" id="pg-a' + n + '" data-pg="a' + n + '" placeholder="' + esc(t("pg.amountPh2")) + '">' + esc(pg["a" + n] || "") + "</textarea>") + "</fieldset>";
    const msg = C.waMessage(s);
    return '<div class="stack"><h1>' + esc(t("pg.title")) + '</h1><p class="muted">' + esc(t("pg.sub")) + "</p></div>" +
      (nd ? '<div class="next-dose"><span><span class="small" style="color:#DCE7FF">' + esc(t("home.nextDose")) + " · " + esc(t(nd.label)) + "</span><br><b>" + esc(C.fmtDateTime(nd.at)) + '</b></span><span class="pill blue">' + esc(untilText(nd.at)) + "</span></div>" : "") +
      '<form class="panel" id="pgForm">' +
        f(t("pg.product"), '<select class="inp" id="pg-product" data-pg="productSel"><option value=""></option>' + PRODUCTS.map((x) => "<option" + (pg.product === x ? " selected" : "") + ">" + esc(x) + "</option>").join("") + '<option value="__other"' + (!known && pg.product ? " selected" : "") + ">" + esc(t("pg.other")) + "</option></select>") +
        '<input class="inp" id="pg-productOther" data-pg="productOther" placeholder="' + esc(t("pg.other")) + '" value="' + esc(known ? "" : pg.product || "") + '"' + (known || !pg.product ? " hidden" : "") + ">" +
        '<label class="chip" style="align-self:flex-start"><input type="checkbox" id="pg-split" data-pg="split"' + (pg.split ? " checked" : "") + "> " + esc(t("pg.split")) + "</label>" +
        doseFields(1) + (pg.split ? doseFields(2) : "") +
        f(t("pg.stop"), '<input class="inp" id="pg-stop" data-pg="stop" type="datetime-local" value="' + esc(pg.stop || "") + '">') +
        '<div class="grid2">' +
          f(t("pg.lead"), '<select class="inp" id="pg-lead" data-pg="lead">' + ["0", "15", "30", "60"].map((x) => '<option value="' + x + '"' + (pg.lead === x ? " selected" : "") + ">" + esc(t("pg.lead" + x)) + "</option>").join("") + "</select>") +
          f(t("pg.phone"), '<input class="inp" id="pg-phone" data-pg="phone" type="tel" inputmode="tel" placeholder="+65 ' + esc(t("pg.phonePh")) + '" value="' + esc(pg.phone || "") + '">') +
        "</div>" +
        '<button class="btn block" type="submit">' + esc(t("pg.save")) + "</button>" +
      "</form>" +
      '<section class="panel"><h2>' + esc(t("pg.preview")) + '</h2><div class="wa"><div class="wa-bubble" id="waText">' + esc(msg) + "</div></div>" +
        '<div class="row"><a class="btn" id="waLink" href="' + esc(C.waLink(pg.phone, msg)) + '" target="_blank" rel="noopener">' + esc(t("pg.open")) + '</a><button type="button" class="btn line" data-act="copy">' + esc(t("pg.copy")) + "</button></div>" +
        A().note("info", esc(t("pg.proto"))) + "</section>" +
      '<section class="panel wash"><h2>' + esc(t("pg.tips")) + '</h2><ul class="why-list">' + [1, 2, 3, 4, 5].map((i) => "<li>" + esc(t("tip" + i)) + "</li>").join("") + "</ul></section>";
  };
  V.bindPurge = function (root) {
    const s = A().state, pg = s.purg;
    const refresh = () => { const msg = C.waMessage(s); root.querySelector("#waText").textContent = msg; root.querySelector("#waLink").href = C.waLink(pg.phone, msg); };
    root.querySelectorAll("[data-pg]").forEach((el) => el.addEventListener(el.tagName === "SELECT" || el.type === "checkbox" ? "change" : "input", () => {
      const k = el.dataset.pg;
      if (k === "split") { pg.split = el.checked; A().save(); A().render(); return; }
      if (k === "productSel") {
        const other = root.querySelector("#pg-productOther");
        if (el.value === "__other") { other.hidden = false; pg.product = other.value; } else { other.hidden = true; pg.product = el.value; }
      } else if (k === "productOther") pg.product = el.value;
      else pg[k] = el.value;
      A().save(); refresh();
    }));
    root.querySelector("#pgForm").addEventListener("submit", (e) => { e.preventDefault(); A().save(); A().render(); A().toast(t("pg.saved")); });
    root.onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.glass) {
        const [k, i] = b.dataset.glass.split(":"); pg.ticks = pg.ticks || {}; const arr = pg.ticks[k] = pg.ticks[k] || [];
        arr[+i] = !arr[+i]; A().save(); A().render();
      } else if (b.dataset.act === "copy") {
        const txt = C.waMessage(s);
        try { navigator.clipboard.writeText(txt).then(() => A().toast(t("pg.copied")), selectText); } catch (err) { selectText(); }
      }
    };
    function selectText() { const r = document.createRange(); r.selectNodeContents(root.querySelector("#waText")); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); }
  };

  /* ================= READINESS ================= */
  // Reference pictures, drawn to match the standard prep-readiness colour chart and the Bristol Stool Form Scale.
  const STAGE = [
    { fill: "#3B2412", op: 1, cloud: 0.9, bits: 9, bit: "#24160A" },
    { fill: "#7A4F28", op: 0.95, cloud: 0.6, bits: 7, bit: "#4E3016" },
    { fill: "#C0621A", op: 1, cloud: 0.25, bits: 4, bit: "#7A3F0F" },
    { fill: "#F2A544", op: 0.9, cloud: 0.05, bits: 2, bit: "#B8651E" },
    { fill: "#F4E07A", op: 0.7, cloud: 0, bits: 0, bit: "" }
  ];
  function colourSvg(i) {
    const st = STAGE[i - 1];
    const pts = [[30, 38], [44, 34], [36, 46], [52, 42], [24, 44], [40, 30], [48, 48], [28, 34], [56, 38]];
    const bits = pts.slice(0, st.bits).map(([x, y], k) => '<ellipse cx="' + x + '" cy="' + y + '" rx="' + (i <= 2 ? 3.2 : 1.6) + '" ry="' + (i <= 2 ? 2.2 : 1.2) + '" fill="' + st.bit + '" transform="rotate(' + (k * 37) + " " + x + " " + y + ')"/>').join("");
    return '<svg viewBox="0 0 80 64" width="80" height="64" aria-hidden="true">' +
      '<ellipse cx="40" cy="36" rx="38" ry="26" fill="#FFFFFF" stroke="#C9D3E3" stroke-width="2"/>' +
      '<ellipse cx="40" cy="38" rx="28" ry="18" fill="#EAF0F8"/>' +
      '<ellipse cx="40" cy="39" rx="26" ry="16" fill="' + st.fill + '" fill-opacity="' + st.op + '"/>' +
      (st.cloud ? '<ellipse cx="40" cy="39" rx="26" ry="16" fill="#5A3A1C" fill-opacity="' + (st.cloud * 0.25) + '"/>' : "") +
      bits + '<ellipse cx="32" cy="31" rx="9" ry="2.4" fill="#FFFFFF" fill-opacity="0.45"/></svg>';
  }
  function bristolSvg(n) {
    // Redrawn after the standard Bristol Stool Chart: brown forms with soft shading on a light card.
    const d = "#5E3A1A", m = "#7B4B22", l = "#9A6433";
    const grad = '<defs><radialGradient id="bs' + n + '" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="' + l + '"/><stop offset=".6" stop-color="' + m + '"/><stop offset="1" stop-color="' + d + '"/></radialGradient></defs>';
    const F = 'fill="url(#bs' + n + ')"';
    const art = {
      // 1 — separate hard lumps, like nuts
      1: [[14, 22, 6, 5.5], [28, 17, 5.5, 5], [44, 24, 6.5, 5.5], [58, 17, 5, 4.5], [74, 23, 6, 5.5], [88, 18, 5, 4.6]].map(([x, y, rx, ry]) => '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" ' + F + '/>').join(""),
      // 2 — sausage-shaped but lumpy
      2: '<path d="M10 22c0-6 5-9 10-8 3-4 9-4 12-1 3-3 9-3 12 0 3-3 9-3 12 0 3-3 9-3 12 0 4-1 9 2 9 8s-5 9-10 8c-3 3-9 3-12 0-3 3-9 3-12 0-3 3-9 3-12 0-3 3-9 3-12 0-5 1-9-3-9-7z" ' + F + '/>',
      // 3 — like a sausage but with cracks on its surface
      3: '<path d="M12 20c0-6 6-9 14-9h46c8 0 14 3 14 9s-6 9-14 9H26c-8 0-14-3-14-9z" ' + F + '/><path d="M24 12l3 5-2 4M38 11l2 6M52 12l-2 5 3 3M66 11l2 5M78 13l-3 5M32 29l2-5M46 29l-1-4M60 29l2-5M72 28l-2-4" fill="none" stroke="#3A2210" stroke-width="1.3" stroke-linecap="round"/>',
      // 4 — like a sausage or snake, smooth and soft
      4: '<path d="M8 26c10-12 24-12 38-8s28 4 46-6c3-2 6 1 4 4-17 13-34 12-49 8s-26-4-36 5c-3 2-6-1-3-3z" ' + F + '/>',
      // 5 — soft blobs with clear-cut edges
      5: '<path d="M8 27c0-5 4-8 9-8s9 3 9 7-4 6-9 6-9-1-9-5z" ' + F + '/><path d="M30 20c0-5 5-8 10-7s9 4 8 8-5 6-10 5-8-2-8-6z" ' + F + '/><path d="M34 30c1-3 5-4 8-3s5 3 4 5-5 3-8 2-5-2-4-4z" ' + F + '/><path d="M54 25c0-5 4-7 9-7s9 3 8 7-5 6-9 6-8-2-8-6z" ' + F + '/><path d="M76 20c0-4 4-6 8-6s8 2 8 6-4 6-8 6-8-2-8-6z" ' + F + '/><path d="M80 30c0-3 3-4 6-4s6 1 6 4-3 4-6 4-6-1-6-4z" ' + F + '/>',
      // 6 — fluffy pieces with ragged edges, a mushy stool
      6: '<path d="M8 28l3-5 2 2 2-6 3 3 3-7 2 4 4-6 2 5 3-4 3 5 4-6 2 5 4-5 2 6 3-3 3 6 4-4 2 5 3-3 2 5 3-2 3 5 2-1 1 4c-6 3-14 4-22 4H30c-9 0-16-1-22-4z" ' + F + '/><path d="M20 26l3-3 3 2 4-3 3 3 4-3 3 2 4-2 3 3 4-2" fill="none" stroke="' + l + '" stroke-width="1.2" opacity=".8"/>',
      // 7 — watery, no solid pieces, entirely liquid
      7: '<path d="M8 27c4-5 12-6 18-4 5-5 16-6 22-2 6-4 17-4 23 1 7-2 16 0 20 5-2 4-10 5-16 4-8 2-20 2-28 1-9 1-20 1-28-1-6 1-10-1-11-4z" fill="' + l + '" fill-opacity=".85"/><path d="M20 26c6-2 14-2 20 0M52 24c6-2 12-1 16 1" fill="none" stroke="#C99A5E" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="80" cy="21" rx="3" ry="1.6" fill="' + l + '" fill-opacity=".8"/><ellipse cx="14" cy="22" rx="2" ry="1.2" fill="' + l + '" fill-opacity=".8"/>'
    }[n];
    return '<svg viewBox="0 0 100 40" width="130" height="52" aria-hidden="true">' + grad + '<rect width="100" height="40" rx="8" fill="#FBF7F0"/>' + art + "</svg>";
  }


  function opt(q, v, label, pic) {
    const a = A().state.ready;
    return '<button type="button" class="opt pic" data-q="' + q + '" data-v="' + v + '" aria-pressed="' + (String(a[q]) === String(v)) + '">' + (pic || '<span class="dot"></span>') + "<span>" + esc(label) + "</span></button>";
  }
  function resultHtml() {
    const s = A().state, a = s.ready, h = A().hosp();
    const r = C.readiness(a);
    const L = { good: t("rd.good"), partial: t("rd.partial"), poor: t("rd.poor") };
    const SL = { ready: t("rd.sReady"), almost: t("rd.sAlmost"), not: t("rd.sNot") };
    const act = r.flag !== "green";
    const call = h.phone ? t("rd.call", { label: h.phoneLabel || h.name, phone: h.phone }) : t("rd.callGeneric");
    const cellCls = (pv, sv) => (sv === "not" || pv === "poor") ? "r" : (sv === "ready" && pv === "good") ? "g" : "a";
    const cellTxt = { r: "🔴", a: "🟡", g: "🟢" };
    const grid = '<div class="grid-wrap"><table class="logic"><caption class="tiny" style="text-align:left">' + esc(t("rd.grid")) + '</caption><thead><tr><th></th><th scope="col">' + esc(SL.ready) + '</th><th scope="col">' + esc(SL.almost) + '</th><th scope="col">' + esc(SL.not) + "</th></tr></thead><tbody>" +
      ["good", "partial", "poor"].map((pv) => '<tr><th scope="row">' + esc(t("rd.inPurg")) + ": " + esc(L[pv]) + "</th>" + ["ready", "almost", "not"].map((sv) => { const c = cellCls(pv, sv); return '<td class="' + c + (pv === a.purg && sv === r.stool ? " hit" : "") + '">' + cellTxt[c] + "</td>"; }).join("") + "</tr>").join("") + "</tbody></table></div>";
    return '<section class="flag ' + r.flag + '" id="flagOut" role="alert"><div class="lamp"><i></i><h2>' + esc(t("rd." + r.flag)) + "</h2></div>" +
        (act ? '<p class="act-now">' + esc(t("rd.msgAct")) + '</p><p style="user-select:all">' + esc(call) + "</p><p>" + esc(t("rd.noExtra")) + "</p>" : "<p><b>" + esc(t("rd.msgGreen2")) + "</b></p>") +
      "</section>" +
      '<section class="panel"><h2>' + esc(t("rd.logic")) + '</h2><div class="inputs-sum">' +
        "<div><b>" + esc(SL[r.stool]) + "</b>" + esc(t("rd.inStool")) + "</div><div><b>" + esc(L[a.purg]) + "</b>" + esc(t("rd.inPurg")) + "</div></div>" +
        "<h3>" + esc(t("rd.rulesTitle")) + '</h3><ol class="rules">' + [1, 2, 3].map((i) => '<li data-hit="' + esc(t("rd.matched")) + '"' + (i === r.rule ? ' class="hit"' : "") + ">" + esc(t("rd.rule" + i)) + "</li>").join("") + "</ol>" +
        grid +
        '<p class="small muted">' + esc(t("rd.weights2")) + "</p>" +
        '<p class="small muted">' + esc(t("rd.stoolNote2")) + "</p>" +
        '<p class="small muted">' + esc(t("rd.freqNote")) + "</p>" +
      "</section>";
  }
  V.ready = function () {
    const s = A().state, a = s.ready = s.ready || {};
    const d0 = C.parseDate(s.profile.date), n = C.daysUntil(s.profile.date);
    const dateTxt = C.fmtDate(d0, { weekday: "long", day: "numeric", month: "long" });
    const open = n === 0;
    const complete = a.purg && a.colour && a.form;
    const questions = open ?
      '<section class="panel"><h3>1. ' + esc(t("rd.q3")) + '</h3><div class="stool-opts">' + ["good", "partial", "poor"].map((v) => opt("purg", v, t("rd.q3." + v))).join("") + "</div></section>" +
      '<section class="panel"><h3>2. ' + esc(t("rd.qColour", { date: dateTxt })) + '</h3><div class="stool-opts">' + [1, 2, 3, 4, 5].map((v) => opt("colour", v, t("rd.s" + v), colourSvg(v))).join("") + '</div><p class="tiny">' + esc(t("rd.imgNote")) + "</p></section>" +
      '<section class="panel"><h3>3. ' + esc(t("rd.qForm", { date: dateTxt })) + '</h3><p class="tiny">' + esc(t("rd.formScale")) + '</p><div class="stool-opts">' + [1, 2, 3, 4, 5, 6, 7].map((v) => opt("form", v, t("bristol." + v), bristolSvg(v))).join("") + '</div><p class="tiny">' + esc(t("rd.imgNote")) + "</p></section>" +
      '<button type="button" class="btn block" data-act="check"' + (complete ? "" : " disabled") + ">" + esc(t("rd.check")) + "</button>" +
      (!complete ? '<p class="tiny" style="text-align:center">' + esc(t("rd.incomplete3")) + "</p>" : "") +
      (complete && a.shown ? resultHtml() : "")
      : '<section class="panel locked">' + A().ICON.shield + "<p><b>" + esc(t(n > 0 ? "rd.locked" : "rd.lockedPast", { date: dateTxt })) + "</b></p></section>";
    return '<div class="stack"><h1>' + esc(t("rd.title")) + "</h1></div>" + questions +
      '<div class="disc-box">' + A().ICON.shield + "<span>" + esc(t("rd.disclaimer")) + "</span></div>";
  };
  V.bindReady = function (root) {
    const s = A().state;
    root.onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (C.daysUntil(s.profile.date) !== 0) return;          // recording only on the colonoscopy date
      if (b.dataset.q) { const v = b.dataset.v; s.ready[b.dataset.q] = /^\d$/.test(v) ? +v : v; A().save(); const y = window.scrollY; A().render(); window.scrollTo(0, y); }
      else if (b.dataset.act === "check") { s.ready.shown = true; A().save(); A().render(); const f = document.getElementById("flagOut"); if (f) f.scrollIntoView({ block: "start" }); }
    };
  };
})();
