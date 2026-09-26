/* Colonaid engine — pure logic, no DOM. */
(function () {
  const LANGS = ["en", "zh", "ms", "ta"];
  const LANG_IDX = { en: 0, zh: 1, ms: 2, ta: 3 };
  const LOCALE = { en: "en-SG", zh: "zh-SG", ms: "ms-MY", ta: "ta-SG" };

  /* ---------------- storage ---------------- */
  let KEY = "colonaid-demo.v1:anon";
  const SESSION = "colonaid-demo.session";
  function setUser(u) { KEY = "colonaid-demo.v1:" + String(u || "anon").replace(/\D/g, ""); }
  function getSession() { try { return localStorage.getItem(SESSION); } catch (e) { return null; } }
  function setSession(u) { try { u ? localStorage.setItem(SESSION, u) : localStorage.removeItem(SESSION); } catch (e) {} }
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch (e) {}
    return null;
  }
  function save(state) { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function wipe() { try { localStorage.removeItem(KEY); } catch (e) {} }

  /* ---------------- i18n ---------------- */
  let lang = "en";
  function setLang(l) { lang = LANGS.includes(l) ? l : "en"; document.documentElement.lang = lang; }
  function t(key, vars) {
    const dict = window.CA_I18N[lang] || {};
    let s = dict[key] != null ? dict[key] : (window.CA_I18N.en[key] != null ? window.CA_I18N.en[key] : key);
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
    return s;
  }
  const foodName = (f) => f.n[LANG_IDX[lang]] || f.n[0];

  /* ---------------- dates ---------------- */
  function parseDate(s) { if (!s) return null; const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function today() { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
  function daysUntil(dateStr) { const d = parseDate(dateStr); if (!d) return null; return Math.round((d - today()) / 86400000); }
  function fmtDate(d, opts) { return d.toLocaleDateString(LOCALE[lang], opts || { weekday: "short", day: "numeric", month: "short" }); }
  function fmtDateTime(d) { return d.toLocaleString(LOCALE[lang], { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); }

  /* ---------------- hospital ---------------- */
  function hospital(id) { return window.CA_HOSPITALS.find((h) => h.id === id) || window.CA_HOSPITALS[window.CA_HOSPITALS.length - 1]; }
  function hospitalKb(h) {
    if (h.kb) return h.rules === "baseline" ? h.kb + window.CA_BASELINE_KB : h.kb;
    if (h.kbRef) return hospital(h.kbRef).kb;
    return window.CA_BASELINE_KB;
  }
  function shortHospital(h) { const m = h.name.match(/\(([^)]+)\)/); return m ? m[1] : h.name.replace(/ Hospital.*/, ""); }

  /* ---------------- profile parsing ---------------- */
  const DIET_BLOCK = {
    none: [],
    veg: ["chicken", "fish", "pork", "shellfish", "beef", "mutton", "meat", "egg"],
    lactoovo: ["chicken", "fish", "pork", "shellfish", "beef", "mutton", "meat"],
    egg: ["chicken", "fish", "pork", "shellfish", "beef", "mutton", "meat"],
    vegan: ["chicken", "fish", "pork", "shellfish", "beef", "mutton", "meat", "egg", "dairy"]
  };
  const ALLERGY_MAP = [
    [/egg|蛋|telur|முட்டை/, "egg"],
    [/milk|dairy|lactose|cheese|奶|乳|susu|tenusu|பால்/, "dairy"],
    [/shellfish|prawn|shrimp|crab|lobster|cockle|虾|蟹|贝|udang|ketam|kerang|இறால்|நண்டு/, "shellfish"],
    [/\bfish\b|鱼|ikan|மீன்/, "fish"],
    [/soy|soya|tofu|大豆|黄豆|豆腐|kacang soya|சோயா/, "soy"],
    [/peanut|nut|花生|坚果|kacang|வேர்க்கடலை|கொட்டை/, "nut"],
    [/gluten|wheat|coeliac|celiac|麸质|小麦|gandum|கோதுமை/, "gluten"],
    [/coconut|椰|kelapa|தேங்காய்/, "coconut"]
  ];
  function allergyTags(text) {
    const s = (text || "").toLowerCase(); const out = new Set();
    ALLERGY_MAP.forEach(([re, tag]) => { if (re.test(s)) out.add(tag); });
    return [...out];
  }
  function exclusion(food, p) {
    const block = new Set(DIET_BLOCK[p.diet || "none"] || []);
    if (p.halal) block.add("pork");
    if (p.gf) block.add("gluten");
    const allergic = allergyTags(p.allergies);
    if (food.t.some((x) => allergic.includes(x))) return "allergy";
    if (food.t.some((x) => block.has(x))) return "notYou";
    return null;
  }

  const COND_RULES = [
    ["diabetes", /diabet|糖尿|kencing manis|நீரிழிவு|blood sugar/],
    ["constipation", /constipat|便秘|sembelit|மலச்சிக்கல்/],
    ["renal", /kidney|renal|ckd|dialysis|heart|cardiac|肾|心脏|心衰|buah pinggang|jantung|சிறுநீரக|இதய/],
    ["stoma", /stoma|ostomy|colostomy|ileostomy|造口|造瘘|ஸ்டோமா/],
    ["surgery", /surgery|resection|colectomy|hemicolectomy|operation|手术|pembedahan|dibedah|அறுவை/],
    ["neuro", /parkinson|stroke|dementia|帕金森|中风|失智|strok|demensia|பார்கின்சன்|பக்கவாத|மறதி/],
    ["swallow", /swallow|dysphagia|appetite|吞咽|食欲|menelan|selera|விழுங்க|பசியின்மை/],
    ["prior", /fail|inadequate|poor prep|redo|repeat|不成功|失败|gagal|தோல்வி/],
    ["ibd", /crohn|colitis|ibd|克罗恩|结肠炎|கிரோன்/]
  ];
  const MED_RULES = [
    ["anticoag", /warfarin|apixaban|eliquis|rivaroxaban|xarelto|dabigatran|pradaxa|enoxaparin|clexane|lovenox|edoxaban|lixiana|华法林/],
    ["antiplatelet", /clopidogrel|plavix|ticagrelor|brilinta|prasugrel|effient/],
    ["aspirin", /aspirin|cardiprin|阿司匹林|ஆஸ்பிரின்/],
    ["iron", /iron|ferrous|ferro|feroglobin|铁|zat besi|இரும்பு/],
    ["glp1", /semaglutide|ozempic|wegovy|rybelsus|liraglutide|victoza|saxenda|dulaglutide|trulicity|tirzepatide|mounjaro/],
    ["sglt2", /empagliflozin|jardiance|dapagliflozin|forxiga|farxiga|canagliflozin|invokana/],
    ["diabetes", /metformin|glucophage|gliclazide|diamicron|glipizide|glimepiride|sitagliptin|januvia|linagliptin|trajenta|vildagliptin|galvus|二甲双胍|மெட்ஃபார்மின்/],
    ["insulin", /insulin|lantus|novorapid|humalog|toujeo|levemir|胰岛素|இன்சுலின்/],
    ["opioid", /codeine|tramadol|morphine|oxycodone|fentanyl|methadone/],
    ["tca", /amitriptyline|nortriptyline|imipramine|antidepress|抗抑郁/],
    ["antidiarrhoeal", /loperamide|imodium|止泻/],
    ["fibre", /fybogel|psyllium|metamucil|ispaghula|纤维/],
    ["supplement", /fish oil|omega|鱼油|herbal|turmeric|ginkgo|supplement|保健/],
    ["weightloss", /phentermine|duromine|orlistat|xenical/]
  ];
  function conditionFlags(p) {
    const s = (p.conditions || "").toLowerCase(); const out = [];
    COND_RULES.forEach(([k, re]) => { if (re.test(s)) out.push(k); });
    return out;
  }
  function medFlags(p) {
    const s = (p.meds || "").toLowerCase(); const out = [];
    MED_RULES.forEach(([k, re]) => { const m = s.match(re); if (m) out.push({ k, m: m[0] }); });
    return out;
  }
  function hasFluidCaution(p) { return conditionFlags(p).includes("renal"); }
  function hasDiabetes(p) { return conditionFlags(p).includes("diabetes") || medFlags(p).some((x) => ["diabetes", "insulin", "sglt2", "glp1"].includes(x.k)); }

  /* ---------------- food status ---------------- */
  function ruleStatus(food, h) {
    if (food.r === "ok") return "yes";
    if (food.r === "avoid") return "no";
    if (food.r === "ask") return "ask";
    const rs = window.CA_RULESETS[h.rules] || window.CA_RULESETS.baseline;
    return rs[food.r] || "ask";
  }
  function foodStatus(food, h) {
    const rs = window.CA_RULESETS[h.rules] || window.CA_RULESETS.baseline;
    if (rs.deny && rs.deny.includes(food.id)) return "no";
    const s = ruleStatus(food, h);
    if (rs.allow && s === "yes" && !rs.allow.includes(food.id)) return "ask";
    return s;
  }
  function modsFor(f, h) { return (f.mod || []).concat((h.extraMods && h.extraMods[f.id]) || []).filter((x, i, a) => a.indexOf(x) === i); }
  function isUsable(food, h, p) { const s = foodStatus(food, h); return (s === "yes" || s === "lowfat") && !exclusion(food, p); }

  function checkFood(query, h, p) {
    const q = (query || "").trim().toLowerCase();
    if (q.length < 2) return [];
    const foods = window.CA_FOODS; const hits = new Map();
    // Latin-script queries match at word starts ("yam" must not match "ayam"); other scripts match anywhere.
    const latin = /^[a-z0-9 .'-]+$/.test(q);
    const esc = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = latin ? new RegExp("(^|[^a-z])" + esc) : null;
    const hit = (text) => (re ? re.test(text) : text.includes(q));
    foods.forEach((f) => { if (f.n.some((n) => hit(n.toLowerCase()))) hits.set(f.id, f); });
    Object.keys(window.CA_FOOD_ALIASES).forEach((a) => {
      if (hit(a) || (latin && new RegExp("(^|[^a-z])" + a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "($|[^a-z])").test(q))) { const f = foods.find((x) => x.id === window.CA_FOOD_ALIASES[a]); if (f) hits.set(f.id, f); }
    });
    return [...hits.values()].slice(0, 5).map((f) => {
      const status = foodStatus(f, h);
      return { food: f, status, excl: exclusion(f, p), clearOk: f.m.includes("c") && status === "yes" };
    });
  }

  /* ---------------- diet plan ---------------- */
  function pool(letter, h, p) {
    const prefs = p.cuisines && p.cuisines.length ? p.cuisines : null;
    const all = window.CA_FOODS.filter((f) => f.m.includes(letter) && isUsable(f, h, p));
    if (!prefs) return all;
    const preferred = all.filter((f) => f.cu === "x" || prefs.some((c) => f.cu.includes(c)));
    return preferred.length >= 3 ? preferred.concat(all.filter((f) => !preferred.includes(f))) : all;
  }
  const pick = (arr, i) => (arr.length ? arr[((i % arr.length) + arr.length) % arr.length] : null);

  function lrDay(k, h, p) {
    const B = pool("b", h, p).filter((f) => !f.m.includes("k")), LD = pool("l", h, p).filter((f) => f.m.includes("d")), K = pool("k", h, p);
    const sOnly = pool("s", h, p).filter((f) => !f.m.includes("b"));
    const S = sOnly.length >= 2 ? sOnly : pool("s", h, p);
    // pick without repeating a dish already chosen for this day
    const used = new Set();
    const pickNew = (arr, i) => { for (let j = 0; j < arr.length; j++) { const f = pick(arr, i + j); if (!used.has(f.id)) { used.add(f.id); return f; } } return null; };
    const b = pickNew(B, k), l = pickNew(LD, k * 2), d = pickNew(LD, k * 2 + 1);
    const meals = [
      { key: "b", items: [b].filter(Boolean) },
      { key: "l", items: [l].filter(Boolean) },
      { key: "d", items: [d].filter(Boolean) },
      { key: "s", items: [pick(S, k), pick(S, k + 3)].filter((x, i, a) => x && a.indexOf(x) === i && !used.has(x.id)) },
      { key: "k", items: [pick(K, k), pick(K, k + 2), pick(K, k + 4)].filter((x, i, a) => x && a.indexOf(x) === i) }
    ];
    return { type: "lr", meals: meals.filter((m) => m.items.length) };
  }
  function clearList(h, p) {
    return window.CA_FOODS.filter((f) => f.m.includes("c") && foodStatus(f, h) === "yes" && !exclusion(f, p));
  }
  function buildPlan(p) {
    const h = hospital(p.hospital); const d0 = parseDate(p.date);
    const days = [];
    [3, 2].forEach((n, k) => days.push(Object.assign(lrDay(k, h, p), { offset: n, date: addDays(d0, -n) })));
    const dbDay = { offset: 1, date: addDays(d0, -1), type: "db", mode: h.dayBefore, clear: clearList(h, p) };
    if (h.dayBefore === "nuh") { dbDay.lr = lrDay(2, h, p).meals.filter((m) => m.key !== "k"); dbDay.time = p.time || ""; }
    if (h.dayBefore === "sgh") dbDay.lr = lrDay(2, h, p).meals.filter((m) => m.key !== "k");
    if (h.dayBefore === "skh") dbDay.lr = lrDay(2, h, p).meals.filter((m) => m.key === "b" || m.key === "l");
    if (h.dayBefore === "cgh") dbDay.eggOk = !exclusion({ t: ["egg", "gluten"] }, p);
    days.push(dbDay);
    days.push({ offset: 0, date: d0, type: "do", mode: h.dayOf, time: p.time || "" });
    return { hospital: h, days };
  }
  function proteinIdeas(h, p) {
    const tags = ["egg", "soy", "dairy", "fish", "chicken", "pork", "shellfish"];
    return window.CA_FOODS.filter((f) => f.m && /[bld]/.test(f.m) && f.t.some((x) => tags.includes(x)) && isUsable(f, h, p)).slice(0, 6);
  }
  function excludedByAllergy(h, p) {
    return window.CA_FOODS.filter((f) => f.m && foodStatus(f, h) === "yes" && exclusion(f, p) === "allergy");
  }

  /* ---------------- fluids ---------------- */
  function prepDates(p) { const d0 = parseDate(p.date); return [3, 2, 1, 0].map((n) => iso(addDays(d0, -n))); }
  function dayTotal(state, dateStr) { return (state.fluids[dateStr] || []).reduce((a, e) => a + e.ml, 0); }
  function fluidPct(state) {
    const p = state.profile; const tIso = iso(today());
    const dates = prepDates(p).slice(0, 3).filter((d) => d <= tIso);
    if (!dates.length) return null;
    const sum = dates.reduce((a, d) => a + dayTotal(state, d), 0);
    return Math.round((100 * sum) / (state.target * dates.length));
  }

  /* ---------------- readiness ---------------- */
  function stoolClass(colour, form) {
    const c = colour <= 3 ? 0 : colour === 4 ? 1 : 2;       // 0 not, 1 almost, 2 ready
    const f = form <= 6 ? 0 : 2;                              // Bristol 1–6 not ready; 7 (watery) can be ready
    return ["not", "almost", "ready"][Math.min(c, f)];
  }
  function readiness(a) {
    const stool = stoolClass(a.colour, a.form);
    let flag, rule;
    if (stool === "not" || a.purg === "poor") { flag = "red"; rule = 1; }
    else if (stool === "ready" && a.purg === "good") { flag = "green"; rule = 2; }
    else { flag = "amber"; rule = 3; }
    return { flag, rule, stool };
  }

  /* ---------------- purgative / WhatsApp ---------------- */
  function doses(pg) {
    const out = [];
    if (pg.d1) out.push({ label: "pg.dose1", at: new Date(pg.d1), amount: pg.a1, glasses: +pg.g1 || 0, key: "d1" });
    if (pg.split && pg.d2) out.push({ label: "pg.dose2", at: new Date(pg.d2), amount: pg.a2, glasses: +pg.g2 || 0, key: "d2" });
    return out;
  }
  function nextDose(pg) { const now = Date.now(); return doses(pg).find((d) => d.at.getTime() + 60 * 60000 > now) || null; }
  /* hospital purgative schedule (e.g. NUH: 4 packets, one per hour; evening before for morning scopes) */
  function hospitalSchedule(p) {
    const h = hospital(p.hospital), sc = h.schedule;
    if (!sc || !p.time || !p.date) return null;
    const pm = parseInt(p.time, 10) >= 12;
    const slot = pm ? sc.pm : sc.am;
    const day = iso(addDays(parseDate(p.date), slot.day));
    const appt = new Date(p.date + "T" + p.time);
    const stop = new Date(appt.getTime() - sc.stopHours * 3600000);
    const pad = (n) => String(n).padStart(2, "0");
    return { pm, first: day + "T" + slot.times[0], times: slot.times, glasses: slot.times.length * sc.glassesPerPacket,
      stop: iso(stop) + "T" + pad(stop.getHours()) + ":" + pad(stop.getMinutes()) };
  }
  function waMessage(state) {
    const p = state.profile, pg = state.purg || {};
    const lines = [t("msg.header", { name: firstName(p.name) })];
    if (pg.product) lines.push("💊 " + pg.product);
    doses(pg).forEach((d) => lines.push("⏰ " + t(d.label) + ": " + fmtDateTime(d.at) + (d.amount ? "\n   " + d.amount : "")));
    if (pg.stop) lines.push("🚫 " + t("msg.stop", { when: fmtDateTime(new Date(pg.stop)) }));
    lines.push("🔔 " + t("msg.remind", { lead: t("pg.lead" + (pg.lead || "30")) }));
    lines.push(t("msg.footer"));
    return lines.join("\n");
  }
  function waLink(phone, text) {
    let digits = (phone || "").replace(/\D/g, "");
    if (digits.length === 8) digits = "65" + digits;
    return digits ? "https://wa.me/" + digits + "?text=" + encodeURIComponent(text) : "https://wa.me/?text=" + encodeURIComponent(text);
  }
  function firstName(n) { return (n || "").trim().split(/\s+/)[0] || ""; }

  /* ---------------- chatbot grounding ---------------- */
  const LANG_NAME = { en: "English", zh: "Simplified Chinese (简体中文)", ms: "Bahasa Melayu", ta: "Tamil (தமிழ்)" };
  function phaseToday(p) {
    const n = daysUntil(p.date);
    if (n == null) return "unknown";
    if (n > 3) return "before prep starts (" + n + " days away)";
    if (n >= 2) return "low-residue diet day (" + n + " days before)";
    if (n === 1) return "the day before (diet change + clear fluids + purgative)";
    if (n === 0) return "procedure day";
    return "after the procedure date";
  }
  function chatRules(state) {
    const p = state.profile, h = hospital(p.hospital), ENG = window.CA_I18N.en;
    const foodLines = window.CA_FOODS.map((f) => {
      const s = foodStatus(f, h), ex = exclusion(f, p);
      const st = s === "yes" ? "ALLOWED" : s === "lowfat" ? "ALLOWED (low-fat, small portion)" : s === "no" ? "AVOID" : "NOT SPECIFIED BY HOSPITAL - check with hospital / avoid to be safe";
      const extra = [];
      if (f.m.includes("c") && s === "yes") extra.push("also OK on clear-fluid day");
      const fm = modsFor(f, h); if (fm.length) extra.push("prep: " + fm.map((m) => ENG["mod." + m]).join(", "));
      if (f.why) extra.push("reason: " + ENG["why." + f.why]);
      if (ex) extra.push(ex === "allergy" ? "PATIENT IS ALLERGIC" : "not in patient's diet preference");
      return "- " + f.n[0] + ": " + st + (extra.length ? " (" + extra.join("; ") + ")" : "");
    }).join("\n");
    const statusLine = h.status === "verified" ? "Hospital's own sheet is loaded." : h.status === "group" ? "Group sheet shared across the hospital group; the specialist may vary it." : "This hospital's sheet is NOT loaded yet; use the conservative baseline below and tell the patient to follow their own hospital sheet if it differs.";
    return [
      "You are the Colonaid food & drink assistant for a patient in Singapore preparing for a colonoscopy.",
      "",
      "SCOPE: Only answer questions about foods, drinks and liquids during colonoscopy preparation (the low-residue days, the clear-fluid day, the procedure morning), including how to make the purgative drink easier to get down (chilling, straw, clear chasers, allowed flavouring). For ANY other topic — medicines, purgative dose or timing, symptoms, diagnosis, other health questions, or anything unrelated — reply in one or two sentences that you can only help with food and drinks for colonoscopy preparation, and suggest contacting their hospital/clinic (for medicines: their doctor or endoscopy team).",
      "PURGATIVE: Never state purgative doses or timings, even if the hospital sheet mentions them — the patient follows their own prescription and logs it in the app's Purgative tab.",
      "SAFETY: Never tell the patient to take extra purgative, change a dose, stop or start a medicine, or cancel the procedure. If they mention severe abdominal pain, vomiting more than twice, rash, swelling, fainting or bleeding, tell them to contact their hospital now, or go to A&E after hours.",
      "HOSPITAL RULES WIN: Answer strictly from the HOSPITAL SHEET, then the FOOD LIST (already resolved for this hospital and patient), then SHARED NOTES. Never contradict the hospital sheet. If something is not covered, say the hospital's sheet doesn't cover it and advise avoiding it to be safe or checking with the hospital. When unsure, advise avoiding it.",
      "PERSONALISE: respect the patient's diet preference, halal, gluten-free and allergies. Suggest local swaps from the ALLOWED items that fit them.",
      "STYLE: Reply ONLY in " + LANG_NAME[lang] + ". Warm, plain words for an older reader. Under 120 words. Short bullet lines are fine; no headings, no tables, no bold markup. Give the reason briefly. Do not add a disclaimer — the app shows one.",
      "",
      "PATIENT: first name " + firstName(p.name) + "; age " + (p.age || "not given") + "; diet preference: " + ENG["d." + (p.diet || "none")] + (p.halal ? "; halal only" : "") + (p.gf ? "; gluten-free" : "") + "; usual cuisines: " + ((p.cuisines || []).map((c) => ENG["cu." + c]).join(", ") || "not given") + "; allergies: " + (p.allergies || "none stated") + "; conditions: " + (p.conditions || "none stated") + ".",
      "TIMING: today is " + iso(today()) + "; colonoscopy on " + p.date + (p.time ? " at " + p.time : "") + "; today is the " + phaseToday(p) + ".",
      "",
      "HOSPITAL: " + h.name + ". " + statusLine + " Low-residue days on its sheet: " + h.lrDays + ".",
      "HOSPITAL SHEET:\n" + hospitalKb(h),
      "",
      "FOOD LIST (resolved for this hospital):\n" + foodLines,
      "",
      "SHARED NOTES:\n" + window.CA_SHARED_KB
    ].join("\n");
  }

  /* ---------------- diet list (Colonaid Demo) ---------------- */
  const CATS = ["grains", "protein", "dairy", "fruit", "veg", "snacks", "local", "sauces", "clear"];
  function prefProfile(pref) { return { diet: (pref && pref.diet) || "none", halal: !!(pref && pref.halal), gf: !!(pref && pref.gf), allergies: "" }; }
  function clearOnlyDay(h) { return h.dayBefore === "baseline" || h.dayBefore === "parkway"; }
  function dietList(h, pref, day, cat) {
    const pp = prefProfile(pref), out = { can: [], avoid: [], unlisted: [] };
    window.CA_FOODS.forEach((f) => {
      if (!f.c || (cat && cat !== "all" && f.c !== cat)) return;
      if (exclusion(f, pp)) return;                               // hide foods outside the chosen preference
      let s = foodStatus(f, h);
      if (day === 3 && clearOnlyDay(h) && (s === "yes" || s === "lowfat") && !(f.m.includes("c") && s === "yes")) { out.avoid.push({ food: f, reason: "diet.notToday" }); return; }
      if (s === "yes" || s === "lowfat") out.can.push({ food: f, lowfat: s === "lowfat" });
      else if (s === "no") out.avoid.push({ food: f, reason: f.why ? "why." + f.why : "why.ruleNo" });
      else out.avoid.push({ food: f, reason: "why.ruleAsk2" });   // not on the hospital's list → best avoided
    });
    return out;
  }

  /* ---------------- built-in answers (when the AI isn't available to this viewer) ---------------- */
  let INDEX = null;
  function foodIndex() {
    if (INDEX) return INDEX;
    INDEX = [];
    window.CA_FOODS.forEach((f) => f.n.forEach((n) => n.toLowerCase().split(/\s*(?:\/|\(|\)|,|—|–|、|,|或| or | atau )\s*/).forEach((tok) => {
      tok = tok.trim(); if (tok.length >= 3 || (/[^\x00-\x7f]/.test(tok) && tok.length >= 2)) INDEX.push([tok, f.id]);
    })));
    Object.keys(window.CA_FOOD_ALIASES).forEach((a) => INDEX.push([a.toLowerCase(), window.CA_FOOD_ALIASES[a]]));
    INDEX.sort((a, b) => b[0].length - a[0].length);
    return INDEX;
  }
  function findFoods(q) {
    q = " " + q.toLowerCase() + " ";
    const ids = [], taken = [];
    foodIndex().forEach(([tok, id]) => {
      if (ids.length >= 6 || ids.includes(id)) return;
      const latin = /^[a-z0-9 .'+-]+$/.test(tok);
      const at = latin ? q.search(new RegExp("[^a-z0-9]" + tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[^a-z0-9]")) : q.indexOf(tok);
      if (at < 0 || taken.some(([s, e]) => at < e && at + tok.length > s)) return;   // skip overlaps with a longer match
      taken.push([at, at + tok.length]); ids.push(id);
    });
    return ids.map((id) => window.CA_FOODS.find((f) => f.id === id)).filter(Boolean);
  }
  function answerLine(f, h, pp) {
    const ex = exclusion(f, pp), s = foodStatus(f, h);
    let label, reason = "";
    if (ex) label = t(ex === "allergy" ? "chk.allergy" : "chk.notYou");
    else if (s === "yes") label = t("chk.yes");
    else if (s === "lowfat") label = t("chk.lowfat");
    else if (s === "no") { label = t("chk.no"); reason = t(f.why ? "why." + f.why : "why.ruleNo"); }
    else label = t("chk.notListed");
    const mods = (!ex && (s === "yes" || s === "lowfat")) ? modsFor(f, h).map((m) => t("mod." + m)) : [];
    const clear = (!ex && s === "yes") ? t(f.m.includes("c") ? "chk.clearOk" : "chk.clearNo") : "";
    return "• " + foodName(f) + " — " + label + (reason ? ". " + reason.replace(/\.$/, "") : "") + (mods.length ? " (" + mods.join(", ") + ")" : "") + (clear ? ". " + clear + "." : "");
  }
  const byId = (id) => window.CA_FOODS.find((f) => f.id === id);
  // Symptoms and medicines must never reach the food lookup: its "avoid it for now" reads as "stop your medicine".
  const RED_FLAG = /\b(pain(?!kill)|vomit|throw(?:ing)? up|bleed|bloody|blood in|faint|dizz|rash\b|swell|swollen|breathless|short of breath|fever|collapse|cramp)|痛|呕|想吐|吐了|出血|便血|流血|带血|头晕|晕倒|昏倒|皮疹|红疹|肿胀|浮肿|发烧|发热|呼吸困难|\b(sakit|muntah|berdarah|pendarahan|pengsan|pening|ruam|bengkak|sesak nafas|demam)\b|வலி|வாந்தி|இரத்தப்போக்கு|ரத்தப்போக்கு|மயக்க|வீக்க|காய்ச்சல்/i;
  const MED_WORD = /\b(medicines?|medications?|meds|tablets?|pills?|drugs?|doses?|dosage|capsules?|injections?|jabs?|panadol|paracetamol|painkillers?|antibiotics?|inhalers?|vitamins?|fish oil|omega|ginkgo|thinners?)\b|药|藥|鱼油|保健|\b(ubat|pil)\b|மருந்து|மாத்திரை/i;
  const isMedQ = (q) => MED_WORD.test(q) || MED_RULES.some(([k, re]) => k !== "supplement" && re.test(q.toLowerCase()));
  function localAnswer(q, state, faq) {
    const h = hospital(state.profile.hospital), pp = prefProfile(state.dietPref), hn = shortHospital(h);
    const lines = (ids) => ids.map(byId).filter(Boolean).map((f) => answerLine(f, h, pp)).join("\n");
    const lead = t("la.lead", { hospital: hn });
    switch (faq) {
      case 1: return lead + "\n" + lines(["milo", "kopio", "milk"]);
      case 2: {
        const vp = Object.assign({}, pp, { diet: pp.diet === "none" ? "lactoovo" : pp.diet });
        const fs = window.CA_FOODS.filter((f) => (f.c === "protein" || f.c === "dairy") && !exclusion(f, vp) && ["yes", "lowfat"].includes(foodStatus(f, h))).slice(0, 8);
        return t("la.proteinLead") + "\n" + (fs.length ? fs.map((f) => answerLine(f, h, vp)).join("\n") : "• " + t("la.none", { hospital: hn })) + (state.dietPref && state.dietPref.diet ? "" : "\n\n" + t("la.prefHint"));
      }
      case 3: return lead + "\n" + lines(["laksa", "meesoto", "chweekueh"]);
      case 4: {
        const fs = window.CA_FOODS.filter((f) => f.m.includes("c") && foodStatus(f, h) === "yes" && !exclusion(f, pp));
        return t("la.clearLead") + "\n" + fs.map((f) => "• " + foodName(f)).join("\n") + "\n\n" + t("why.colourRule");
      }
      case 5: return t("why.colourRule") + "\n" + t("why.colour");
      case 6: return t("why.purg");
      case 7: return t("la.tasteLead") + "\n• " + t("tip1") + "\n• " + t("tip2") + "\n• " + t("tip3");
      case 8: return lead + "\n" + lines(["milk", "yoghurt", "cheese", "soymilk"]);
    }
    if (RED_FLAG.test(q)) return t("tip4") + "\n" + (h.phone ? t("rd.call", { label: h.phoneLabel || h.name, phone: h.phone }) : t("rd.callGeneric"));
    if (isMedQ(q)) return t("la.scope") + "\n" + t("med.generic");
    const fs = findFoods(q);
    if (!fs.length) return t("la.none", { hospital: hn });
    return lead + "\n" + fs.map((f) => answerLine(f, h, pp)).join("\n");
  }

  window.CA = {
    setUser, getSession, setSession, CATS, dietList, clearOnlyDay, prefProfile, localAnswer, findFoods,
    LANGS, load, save, wipe, setLang, t, lang: () => lang, foodName,
    parseDate, iso, addDays, today, daysUntil, fmtDate, fmtDateTime,
    hospital, shortHospital, conditionFlags, medFlags, hasFluidCaution, hasDiabetes, exclusion,
    foodStatus, modsFor, checkFood, buildPlan, proteinIdeas, excludedByAllergy,
    prepDates, dayTotal, fluidPct, readiness, stoolClass,
    doses, nextDose, hospitalSchedule, waMessage, waLink, firstName, chatRules
  };
})();
