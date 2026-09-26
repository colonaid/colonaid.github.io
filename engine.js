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

  /* ---------------- built-in answers (when the AI isn't available to this viewer) ----------------
     Scope: this assistant answers one kind of question, what the patient can eat or drink during
     colonoscopy prep, from their own hospital's sheet, plus that hospital's stop-eating and
     stop-drinking times and tips for getting the purgative down. Everything else is routed, most
     urgent first: urgent symptoms → hospital now or A&E; other symptoms and medicines → ask your
     doctor; purgative dose or timing → prescription; the procedure itself → hospital; anything
     else → outside scope. A food answer is given only when every food word in the question is
     understood. Anything only partly understood ("fried rice", "bak kut teh", a food we don't list)
     is a grey area and gets "avoid it to be safe", never "allowed". */
  const rx = (parts) => new RegExp(parts.join("|"), "i");
  const URGENT = rx([
    "\\bbleed", "\\bbloody\\b", "\\bblood (in|from|when|on|coming)\\b", "\\bpass(ing|ed)? blood\\b", "\\bblack (stool|poo|motion)",
    "\\bvomit", "\\bthrow(ing|n)? up\\b", "\\bthrew up\\b", "\\bfaint", "\\bpass(ed|ing)? out\\b", "\\bcollaps", "\\bunconscious",
    "\\bchest pain", "\\bbreathless", "\\bshort of breath", "\\b(can'?t|cannot|hard to|difficult(y)?( to)?|trouble) breath",
    "\\b(severe|serious|unbearable|terrible|extreme|very bad|really bad|a lot of|so much|lots of|intense) (stomach |abdominal |tummy |belly )?(pain|cramps?|aches?)",
    "\\brash\\b", "\\bhives\\b", "\\bswell", "\\bswollen\\b", "\\ballergic reaction", "\\banaphyla", "\\bseizure",
    "出血", "便血", "流血", "带血", "血便", "呕吐", "吐了", "晕倒", "昏倒", "昏迷", "胸痛", "胸口痛", "呼吸困难", "喘不过气", "剧痛", "剧烈疼痛", "剧烈腹痛", "很痛", "非常痛", "痛得厉害", "疼得厉害", "皮疹", "红疹", "肿胀", "过敏反应",
    "\\bberdarah\\b", "\\bpendarahan\\b", "\\bdarah (dalam|keluar)\\b", "\\bmuntah", "\\bpengsan\\b", "\\bsesak nafas\\b", "\\bsukar bernafas\\b", "\\bsakit dada\\b", "\\bsakit teruk\\b", "\\bsangat sakit\\b", "\\bterlalu sakit\\b", "\\bruam\\b", "\\bbengkak\\b",
    "இரத்தப்போக்கு", "ரத்தப்போக்கு", "வாந்தி", "மயங்கி", "நெஞ்சு வலி", "மூச்சுத் திணறல்", "கடும் வலி", "கடுமையான வலி", "தடிப்பு", "வீக்க"
  ]);
  const PROC = rx([
    "\\bsedat", "\\ban(a)?esthe", "\\bdriv(e|es|ing|er)\\b", "\\btaxi\\b", "\\bcompanion\\b", "\\baccompan", "\\bescort\\b",
    "\\barriv", "\\breport (at|to)\\b", "\\bregist(er|ration)\\b", "\\bbring\\b", "\\bwear\\b", "\\bjewel", "\\bmake-?up\\b", "\\bnail polish\\b", "\\bcontact lens",
    "\\bhow long (does|will|is|would) (it|the)\\b", "\\bbiops", "\\bpolyp", "\\bcost", "\\bprice\\b", "\\bpay(ment)?\\b", "\\bmedisave\\b", "\\binsurance\\b", "\\bclaim\\b",
    "\\breschedul", "\\bpostpone", "\\bcancel", "\\bappointment (time|date)\\b", "\\bwhat time is my\\b", "\\bparking\\b", "\\bwhere (is|do|should|can) ",
    "\\b(medical certificate|mc|sick leave)\\b", "\\bshower\\b", "\\bbath(e)?\\b", "\\bexercis", "\\bgym\\b", "\\bsex\\b",
    "\\b(is|will|does|would) (it|a|the|my)? ?(colonoscopy|procedure|scope|test)? ?(be |going to be )?(hurt|painful|sore|uncomfortable)\\b",
    "\\bafter (the|my) (colonoscopy|procedure|scope|test)\\b",
    "麻醉", "镇静", "开车", "驾驶", "报到", "带什么", "要带", "穿什么", "首饰", "化妆", "隐形眼镜", "要多久", "多长时间", "活检", "息肉", "费用", "多少钱", "付款", "保健储蓄", "保险", "改期", "延期", "取消", "预约时间", "停车", "陪同", "病假", "洗澡", "会痛吗", "痛不痛", "疼不疼", "会不会痛", "检查后", "做完",
    "\\bbius\\b", "\\bpenenang\\b", "\\bmemandu\\b", "\\bkereta\\b", "\\bteksi\\b", "\\bdaftar\\b", "\\bbawa\\b", "\\bbarang kemas\\b", "\\bkanta lekap\\b", "\\bberapa lama\\b", "\\bbiopsi\\b", "\\bpolip\\b", "\\bkos\\b", "\\bharga\\b", "\\bbayar", "\\binsurans\\b", "\\btangguh", "\\bbatal", "\\btemujanji\\b", "\\bcuti sakit\\b", "\\bmandi\\b", "\\bsenaman\\b", "\\bsakit tak\\b", "\\badakah (ia )?sakit\\b", "\\bselepas (kolonoskopi|prosedur)\\b",
    "மயக்க மருந்து", "வாகனம் ஓட்ட", "கட்டணம்", "குளிக்க"
  ]);
  const HEALTH = rx([
    "\\bfever", "\\b(high|a|my) temperature\\b", "\\bflu\\b", "\\b(have|got|caught|with) (a|the) cold\\b(?!\\s+\\w)", "\\bcough", "\\bsore throat", "\\bhead ?aches?\\b", "\\bmigraine", "\\bdizz", "\\bnause",
    "\\b(feel|feeling|felt|am|i'?m|im) (sick|unwell|ill|weak|terrible|awful)\\b", "\\bunwell\\b", "\\bdiarrh", "\\bconstipat", "\\bpain(?!kill)", "\\bhurts?\\b", "\\baches?\\b", "\\bcramp", "\\bbloat",
    "\\bpregnan", "\\b(my|on my|having my) period\\b", "\\bmenstru", "\\bdiabet", "\\bblood (sugar|pressure)\\b", "\\bhypo(glycaemia|glycemia)?\\b", "\\bkidney", "\\brenal\\b", "\\bheart\\b", "\\bdialysis\\b", "\\bstoma\\b", "\\ballerg", "\\bcovid\\b", "\\binfection\\b", "\\bcancer\\b", "\\basthma\\b", "\\bepilep",
    "发烧", "发热", "体温", "感冒", "咳嗽", "喉咙痛", "头痛", "头疼", "头晕", "恶心", "不舒服", "腹泻", "拉肚子", "便秘", "痛", "疼", "抽筋", "胀气", "怀孕", "月经", "糖尿", "血糖", "血压", "肾", "心脏", "过敏", "癌", "哮喘", "生病", "病了",
    "\\bdemam\\b", "\\bselsema\\b", "\\bbatuk\\b", "\\bpening\\b", "\\bloya\\b", "\\b(tak|tidak) sihat\\b", "\\bcirit", "\\bsembelit\\b", "\\bsakit\\b", "\\bkejang\\b", "\\bkembung\\b", "\\bhamil\\b", "\\bmengandung\\b", "\\bhaid\\b", "\\bdatang bulan\\b", "\\bkencing manis\\b", "\\bgula (dalam )?darah\\b", "\\bdarah tinggi\\b", "\\bbuah pinggang\\b", "\\bjantung\\b", "\\balahan\\b", "\\bkanser\\b", "\\basma\\b",
    "காய்ச்சல்", "இருமல்", "சளி", "தலைவலி", "தலைசுற்றல்", "குமட்டல்", "வயிற்றுப்போக்கு", "மலச்சிக்கல்", "வலி", "கர்ப்ப", "மாதவிடாய்", "நீரிழிவு", "சர்க்கரை நோய்", "இரத்த அழுத்த", "சிறுநீரக", "இதய", "ஒவ்வாமை", "புற்றுநோய்"
  ]);
  const MED_WORD = rx([
    "\\b(medicines?|medications?|meds|tablets?|pills?|drugs?|doses?|dosage|capsules?|injections?|jabs?|panadol|paracetamol|painkillers?|antibiotics?|inhalers?|vitamins?|fish oil|omega|ginkgo|thinners?|fybogel|psyllium|metamucil|ispaghula|iron (tablets?|pills?|supplements?)|ferrous|feroglobin|ibuprofen|nurofen|voltaren|antacids?|gaviscon|probiotics?)\\b",
    "药", "藥", "鱼油", "保健", "班纳杜", "必理痛", "扑热息痛", "退烧药", "止痛药", "抗生素", "维生素", "铁片", "铁剂",
    "\\b(ubat|pil|zat besi)\\b", "மருந்து", "மாத்திரை"
  ]);
  const isMedQ = (q) => MED_WORD.test(q) || MED_RULES.some(([k, re]) => !["supplement", "fibre", "iron"].includes(k) && re.test(q.toLowerCase()));
  const PURG = rx(["\\b(purgatives?|laxatives?|bowel prep(aration)?|prep (drink|solution|medicine|medication|powder)|peg|peg-es|klean-?prep|fortrans|moviprep|plenvu|pico ?prep|pico-?salax|picolax)\\b", "泻药", "清肠", "肠道准备", "导泻", "\\b(julap|pencahar)\\b", "மலமிளக்கி"]);
  const PURG_EASE = rx(["\\b(tastes?|tasting|flavou?rs?|disgusting|horrible|awful|yuck|chill(ed)?|cold|straw|chasers?|mix(ed|ing)?|nause\\w*|sick)\\b", "\\bget it down\\b", "\\bcan'?t (drink|finish|swallow)\\b", "味道", "难喝", "难以下咽", "恶心", "冰", "吸管", "混", "喝不完", "\\b(rasa|sejuk|campur|loya)\\b", "சுவை", "குமட்டல்", "குளிர்"]);
  const TIMING = rx([
    "\\b(when|what time) (should|can|do|must|to|will|shall) (i |we )?(stop|start|eat|drink|have|take|fast)", "\\b(until|till) (what time|when)\\b", "\\bhow (long|many hours) before\\b", "\\bhours? before\\b",
    "\\bstop (eating|drinking|food|drinks?)\\b", "\\bfasting\\b", "\\bfast (from|before|for)\\b", "\\bnil by mouth\\b", "\\bnbm\\b", "\\blast meal\\b",
    "\\b(the )?(day|night|evening) before\\b", "\\beve of\\b", "\\b(the )?(day|morning) of (the |my )?(colonoscopy|procedure|scope|test|appointment)\\b", "\\bon the day\\b", "\\bprocedure day\\b",
    "什么时候(开始|停止|不能|要|可以)", "几点(开始|停止|前|以前)", "停止(吃|喝|进食|饮)", "禁食", "空腹", "最后一餐", "前一天", "前一晚", "前晚", "当天", "几个小时前", "几小时前",
    "\\bbila (perlu|patut|boleh|harus|mesti) (berhenti|mula|makan|minum)", "\\bpukul berapa\\b", "\\bberhenti (makan|minum)\\b", "\\bpuasa\\b", "\\bmakan terakhir\\b", "\\bsehari sebelum\\b", "\\bmalam sebelum\\b", "\\bpada hari (prosedur|kolonoskopi|ujian)\\b",
    "எப்போது (நிறுத்த|சாப்பிட|குடிக்க)", "நிறுத்த வேண்டும்", "உண்ணாவிரத", "முந்தைய நாள்"
  ]);
  const T_BEFORE = rx(["\\b(day|night|evening) before\\b", "\\beve of\\b", "\\blast meal\\b", "前一天", "前一晚", "前晚", "最后一餐", "\\bsehari sebelum\\b", "\\bmalam sebelum\\b", "\\bmakan terakhir\\b", "முந்தைய நாள்"]);
  const T_OF = rx(["\\b(day|morning) of\\b", "\\bon the day\\b", "\\bprocedure day\\b", "\\bhours? before\\b", "\\bhow (long|many hours) before\\b", "当天", "几个?小时前", "\\bpada hari\\b"]);
  const SLIP = rx(["\\baccident(al|ally)?\\b", "\\bby mistake\\b", "\\bmistakenly\\b", "\\bslip(ped|s)?\\b", "\\bcheat(ed)?\\b", "\\balready (ate|had|eaten|drank|drunk)\\b", "\\bi (ate|had|drank) (some|a bit|a little)\\b", "\\bruin(ed|s)?\\b", "\\b(does|will|did) (it|that) (matter|affect)\\b", "\\bis my prep (ok|okay|ruined|still)\\b", "不小心", "吃错", "已经吃了", "会不会影响", "会影响", "白做", "\\b(terlanjur|tersilap|rosak)\\b", "\\bsudah (makan|minum)\\b", "தவறுதலாக", "ஏற்கனவே சாப்பிட்"]);
  const COLOUR_WHY = rx(["\\bwhy\\b[^?]*\\b(red|purple|blue|colou?rs?)\\b", "\\b(red|purple|blue|colou?rs?)\\b[^?]*\\bwhy\\b", "为什么[^?？]*(红|紫|蓝|颜色)", "\\bkenapa\\b[^?]*\\b(merah|ungu|biru|warna)\\b", "ஏன்[^?]*(சிவப்பு|நிற)"]);
  const CLEAR_Q = rx(["\\bclear (fluid|liquid|drink)s?\\b", "\\bclear-(fluid|liquid)s?\\b", "清流质", "流质", "透明液体", "清澈液体", "\\b(cecair|minuman) jernih\\b", "தெளிவான (திரவ|பான)"]);
  const PROTEIN_Q = rx(["\\bprotein\\b", "蛋白质", "蛋白", "புரத"]);
  const FOOD_INTENT = rx(["\\b(eat|eats|eating|ate|eaten|drink|drinks|drinking|drank|food|foods|meal|meals|snack|snacks|breakfast|lunch|dinner|supper|dessert|beverage|dish|dishes|hungry|thirsty)\\b", "吃", "喝", "食物", "饮料", "饮品", "早餐", "午餐", "晚餐", "宵夜", "零食", "点心", "饿", "渴", "\\b(makan|minum|makanan|minuman|sarapan|snek|lapar|dahaga|haus)\\b", "சாப்பிட", "குடிக்க", "உணவு", "பானம்", "சிற்றுண்டி", "பசி", "தாகம்"]);
  const FOOD_WORDS = rx(["\\b(durian|mango|orange|grapes?|pear|kiwi|strawberr(y|ies)|berr(y|ies)|pineapple|rambutan|longan|lychee|coke|cola|pepsi|bubble tea|milk tea|boba|energy drink|red bull|yakult|sandwich|burger|pizza|fries|chips|nuggets|kfc|mcdonald'?s|cookies?|crackers|popcorn|candy|gummy|pudding|sushi|ramen|dim sum|dumplings?|bao|pau|kimchi|steak|lamb|bacon|ham|crab|lobster|squid|sotong|oysters?|clams?|cockles|kueh|kuih|cake|rojak|popiah|otah|murtabak|briyani|biryani|naan)\\b", "榴莲", "芒果", "橙", "葡萄", "梨", "可乐", "奶茶", "汉堡", "披萨", "薯条", "饺子", "包子", "寿司", "拉面", "糕", "螃蟹", "蟹", "鱿鱼", "牛排", "培根", "火腿", "\\b(mangga|oren|anggur|tembikai|nanas|kek|ketam|daging)\\b", "துரியன்", "மாம்பழம்", "ஆரஞ்சு", "திராட்சை", "கேக்"]);

  // words that carry no food meaning (question words, quantities, people, prep words, safe preparation words)
  const STOP = new Set((
    "a an the i im me my mine myself we us our you your he she him her his it its they them their this that these those there here " +
    "is are am was were be been being do does did done doing don can could may might must shall should will would won isn aren doesn didn wasn cant dont wont isnt arent doesnt didnt " +
    "ok okay fine safe allowed allow permitted alright good better best still also too just only even really very so then than please pls plz thanks thank thx " +
    "if of for on in at to into from about before after during while by as some any all more less much many few little bit lot lots amount portion portions piece pieces slice slices cup cups glass glasses bowl bowls plate plates spoon spoons spoonful bottle bottles serving servings " +
    "eat eats eating ate eaten drink drinks drinking drank drunk have has having had take takes taking took get gets got try want wanted like need needs needed able " +
    "what which who whom whose where why how yes today tomorrow tonight yesterday now later soon morning afternoon evening night day days week time times " +
    "prep preparation prepare preparing colonoscopy colonoscopies scope procedure test exam low residue diet food foods meal meals breakfast lunch dinner supper snack snacks hungry thirsty " +
    "mum mom mother dad father wife husband son daughter grandma grandmother grandpa grandfather parent parents family patient " +
    "protein vegetarian vegan halal eggetarian gluten free instead alternative alternatives option options suitable recommended recommend advise idea ideas " +
    "plain white clear cooked well boiled steamed poached soft mashed peeled strained warm hot cold iced ice fresh homemade home normal regular usual usually refined skinless thin spread layer smooth " +
    "one two three four five first second third last again same other another buy make cook prepare order find use add put give serve suck sip chew swallow lick something anything thing things stuff type kind kinds sort question ask asking wondering wonder tell know let " +
    "saya aku kita kami anda awak kamu dia ia mereka boleh bolehkah dapat makan minum ambil nak mahu hendak ingin perlu patut harus mesti ke kah tak tidak bukan ya apa apakah adakah ada ini itu yang untuk pada di dari kepada sebelum selepas semasa sewaktu esok hari pagi petang malam tengah sedikit sikit sahaja saja juga lagi masih dibenarkan benarkan selamat baik kolonoskopi persediaan prosedur ujian sarapan lapar dahaga haus emak mak ibu bapa ayah suami isteri anak nenek datuk cawan gelas mangkuk pinggan keping sudu kosong putih jernih rebus kukus lembut ditapis dikupas suam panas sejuk ais kecil besar satu dua tiga beli buat guna tolong terima kasih soalan tanya macam mana bagaimana berapa banyak"
  ).split(/\s+/));
  const SEP = new Set("and or with plus dan atau dengan serta".split(" "));
  const NEG = new Set("no without tanpa jangan except".split(" "));
  const TA_STOP = ["நான்", "எனக்கு", "என்", "நாங்கள்", "நீங்கள்", "இது", "அது", "இந்த", "அந்த", "சாப்பிட", "குடிக்க", "குடித்", "எடுக்க", "உண்ண", "முடியுமா", "முடியும்", "சரியா", "சரி", "ஆமா", "இல்லை", "வேண்டும்", "வேண்டுமா", "என்ன", "எந்த", "எப்படி", "ஏன்", "நாளை", "இன்று", "காலை", "மதியம்", "மாலை", "இரவு", "நாள்", "முன்", "பின்", "பிறகு", "போது", "கொலனோஸ்கோபி", "தயாரிப்பு", "உணவு", "பானம்", "சிற்றுண்டி", "கொஞ்சம்", "சிறிது", "மட்டும்", "கூட", "பசி", "தாகம்", "அம்மா", "அப்பா", "கணவர்", "மனைவி", "மகன்", "மகள்", "பாட்டி", "தாத்தா", "ஒரு", "இரண்டு", "கப்", "டம்ளர்", "கிண்ணம்", "தட்டு", "வெறும்", "வெள்ளை", "தெளிவான", "வேகவைத்த", "சூடான", "குளிர்ந்த", "அனுமதி"];
  const TA_SEP = new Set(["மற்றும்", "அல்லது"]);
  const ZH_FN = new Set("我你您他她它们的地得了着过吗呢吧啊呀哦嗯哈是不没有可以能会要想该应必须需还也都就再又在从到给把被让请问吃喝饮用食物东西什么怎么样多少几点时候天今明后昨早中午晚夜上下点些一二三四五个这那种样肠镜检查准备前期间第日最近现在行好对么嘛喔啦咯即使如果但而且还因为所儿许稍微大小份碗杯盘块口次顿每家里自己妈爸父母亲老公婆太先生病人医院原味淡清白热冷温软蒸煮去".split(""));
  const ZH_SEP = new Set("和与或及跟、,，;；加配".split(""));
  const ZH_NEG = ["不要", "不加", "没有", "去掉", "别", "无"];
  const stem = (w) => (w.length > 4 && /ies$/.test(w) ? w.slice(0, -3) + "y" : w.length > 4 && /oes$/.test(w) ? w.slice(0, -2) : w.length > 3 && /[^s]s$/.test(w) ? w.slice(0, -1) : w);
  const escRx = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Food tokens: a name's head (before any "(", "—" or ",") names the dish; its tail only describes it.
  // Head tokens beat aliases, aliases beat tail tokens, and a tail token only counts next to its own dish.
  let INDEX = null, TERMS = null;
  function foodIndex() {
    if (INDEX) return INDEX;
    const out = [], split = (s) => s.split(/\s*(?:\/|\(|\)|,|—|–|、|,|或| or | atau |:)\s*/);
    const useful = (tok, tail) => {
      if (!(tok.length >= 3 || (/[^\x00-\x7f]/.test(tok) && tok.length >= 2))) return false;
      if (/^(no|not|without|tanpa)\b/.test(tok) || (tail && /^(不|无|去掉|别|没有)/.test(tok))) return false;
      const ws = tok.match(/[a-z0-9À-ɏ]+/g);
      return !(ws && !/[^\x00-\x7f]/.test(tok) && ws.every((w) => STOP.has(w)));
    };
    window.CA_FOODS.forEach((f) => f.n.forEach((n) => {
      const low = n.toLowerCase(), cut = low.search(/[(—–,]/), head = cut < 0 ? low : low.slice(0, cut), tail = cut < 0 ? "" : low.slice(cut);
      const parts = head.split(/\s*(?:\/|、|或| or | atau )\s*/);
      parts.forEach((tok) => { tok = tok.trim(); if (useful(tok)) out.push({ tok, id: f.id, w: parts.length === 1 ? 3 : 2 }); });
      split(tail).forEach((tok) => { tok = tok.trim(); if (useful(tok, true)) out.push({ tok, id: f.id, w: 0 }); });
    }));
    Object.keys(window.CA_FOOD_ALIASES).forEach((a) => out.push({ tok: a.toLowerCase(), id: window.CA_FOOD_ALIASES[a], w: 1 }));
    out.forEach((e) => { if (/^[\x00-\x7f]+$/.test(e.tok)) e.re = new RegExp("(^|[^a-z0-9])(" + escRx(e.tok) + "(?:e?s)?)(?=[^a-z0-9]|$)", "g"); });
    out.sort((a, b) => b.tok.length - a.tok.length || b.w - a.w);
    return (INDEX = out);
  }
  // the words (Latin), characters (Chinese) and names (Tamil) of each dish, minus anything the name says to leave out
  // ("no mushrooms", "不要香菇、辣椒"), for matching multi-word dishes such as "chicken rice" or "apple juice"
  const NAME_NEG = /(^|[^a-z])(no|not|without|tanpa)([^a-z]|$)|不要|不加|不|无|去掉|இல்லாமல்/;
  function foodTerms() {
    if (TERMS) return TERMS;
    TERMS = window.CA_FOODS.map((f) => {
      const own = f.n.map((n) => { const low = n.toLowerCase(), cut = low.search(/[(—–,]/); return cut < 0 ? low : low.slice(0, cut); });
      const heads = f.n.map((n) => n.toLowerCase().replace(/\(([^)]*)\)/g, (m, inner) => (NAME_NEG.test(inner) ? " , " : " , " + inner + " , "))
        .split(/[,—–:;、,]/).filter((seg) => !NAME_NEG.test(seg)).join(" "));
      const lat = new Set(), cjk = new Set(), hlat = new Set(), hcjk = new Set();
      own.forEach((h) => { (h.match(/[a-z0-9\u00c0-\u024f]+/g) || []).forEach((w) => hlat.add(stem(w))); (h.match(/[\u3400-\u9fff]/g) || []).forEach((c) => hcjk.add(c)); });
      heads.forEach((h) => { (h.match(/[a-z0-9À-ɏ]+/g) || []).forEach((w) => lat.add(stem(w))); (h.match(/[㐀-鿿]/g) || []).forEach((c) => cjk.add(c)); });
      return { id: f.id, lat, cjk, hlat, hcjk, htam: own.filter((h) => /[\u0b80-\u0bff]/.test(h)), tam: heads.filter((h) => /[஀-௿]/.test(h)) };
    });
    return TERMS;
  }
  function spansIn(s, entries, spans) {
    const free = (a, b) => spans.every((x) => b <= x.a || a >= x.b);
    entries.forEach((e) => {
      if (e.re) { e.re.lastIndex = 0; let m; while ((m = e.re.exec(s))) { const a = m.index + m[1].length, b = a + m[2].length; if (free(a, b)) spans.push({ a, b, id: e.id, text: m[2] }); e.re.lastIndex = a + 1; } }
      else { let i = s.indexOf(e.tok); while (i >= 0) { const b = i + e.tok.length; if (free(i, b)) spans.push({ a: i, b, id: e.id, text: e.tok }); i = s.indexOf(e.tok, i + 1); } }
    });
  }
  // Break a question into dish-sized chunks and decide, for each, which listed food it is, or that it's a grey area.
  function analyse(text) {
    const s = " " + String(text || "").toLowerCase().replace(/蛋白质/g, "   ") + " ";
    const idx = foodIndex(), spans = [];
    spansIn(s, idx.filter((e) => e.w > 0), spans);
    const named = new Set(spans.map((x) => x.id));
    spansIn(s, idx.filter((e) => e.w === 0 && named.has(e.id)), spans);
    spans.sort((x, y) => x.a - y.a);
    const units = [];
    const words = (str, glued) => {
      const re = /([a-z0-9À-ɏ]+)|([஀-௿]+)|([㐀-鿿]+)|([,\/&+、,，])|([.?!()\[\]:;—–（）；。？！])/g;
      let m, first = true;
      while ((m = re.exec(str))) {
        const atStart = first && m.index === 0; first = false;
        if (m[1]) { const w = m[1]; units.push({ k: NEG.has(w) ? "neg" : SEP.has(w) ? "sep" : STOP.has(w) || w.length < 2 || /^\d+$/.test(w) ? "stop" : "word", text: w }); }
        else if (m[2]) { const w = m[2];
          if (atStart && glued) continue;                                         // a case ending stuck to the dish before it
          units.push({ k: TA_SEP.has(w) ? "sep" : /இல்லாமல்$/.test(w) ? "negprev" : TA_STOP.some((p) => w.indexOf(p) === 0) ? "stop" : "word", text: w }); }
        else if (m[3]) { const run = m[3];
          for (let i = 0; i < run.length; i++) {
            const neg = ZH_NEG.find((x) => run.substr(i, x.length) === x);
            if (neg) { units.push({ k: "neg" }); i += neg.length - 1; continue; }
            const c = run[i];
            units.push({ k: ZH_SEP.has(c) ? "sep" : ZH_FN.has(c) ? "stop" : "char", text: c });
          } }
        else units.push({ k: m[4] ? "sep" : "end" });
      }
    };
    let pos = 0;
    spans.forEach((sp, i) => { if (sp.a > pos) words(s.slice(pos, sp.a), i > 0); units.push({ k: "food", id: sp.id, text: sp.text }); pos = sp.b; });
    if (pos < s.length) words(s.slice(pos), spans.length > 0 && !/^\s/.test(s.slice(pos)));
    // a "no …" or "without …" covers the whole list it starts ("no mustard seeds, curry leaves or pomegranate")
    const chunks = []; let cur = null, negating = false;
    const close = () => { if (cur && cur.items.length) chunks.push(cur); cur = null; };
    units.forEach((u) => {
      if (u.k === "food" || u.k === "word" || u.k === "char") { if (!cur) cur = { items: [], neg: negating }; cur.items.push(u); }
      else if (u.k === "neg") { close(); negating = true; }
      else if (u.k === "negprev") { if (cur) { cur.neg = true; close(); } else if (chunks.length) chunks[chunks.length - 1].neg = true; }
      else if (u.k === "sep") close();
      else { close(); negating = false; }                                       // a plain word or the end of a phrase ends the list
    });
    close();
    const foods = []; let grey = false;
    chunks.filter((c) => !c.neg).forEach((c) => {
      if (c.items.length === 1 && c.items[0].k === "food") { foods.push(c.items[0].id); return; }
      const lat = [], cjk = [], tam = [];
      c.items.forEach((u) => {
        (u.text.match(/[a-z0-9À-ɏ]+/g) || []).forEach((w) => { if (!STOP.has(w)) lat.push(stem(w)); });
        (u.text.match(/[㐀-鿿]/g) || []).forEach((ch) => { if (!ZH_FN.has(ch)) cjk.push(ch); });
        (u.text.match(/[஀-௿]+/g) || []).forEach((w) => tam.push(w));
      });
      const hits = foodTerms().filter((ft) => lat.every((w) => ft.lat.has(w)) && cjk.every((ch) => ft.cjk.has(ch)) && tam.every((w) => ft.tam.some((n) => n.indexOf(w) >= 0))
        && (lat.some((w) => ft.hlat.has(w)) || cjk.some((ch) => ft.hcjk.has(ch)) || tam.some((w) => ft.htam.some((n) => n.indexOf(w) >= 0)))).map((ft) => ft.id);
      if ((lat.length || cjk.length || tam.length) && hits.length && hits.length <= 4) foods.push(...hits); else grey = true;
    });
    return { exact: spans.length, words: chunks.length, foods: foods.filter((x, i, a) => a.indexOf(x) === i).slice(0, 6), grey };
  }
  function findFoods(q) { return analyse(q).foods.map((id) => window.CA_FOODS.find((f) => f.id === id)).filter(Boolean); }

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
  // the hospital's own day-before and procedure-day instructions
  const DB_LINES = { cgh: [["meal.b", "db.cgh.b"], ["meal.l", "db.cgh.l"], ["meal.d", "db.cgh.d"], [null, "db.cgh.note"]], parkway: [[null, "db.parkway"], [null, "db.parkwayTime"]], sgh: [[null, "db.sgh"]], skh: [[null, "db.skh"]], nuh: [[null, "db.nuh.am2"], [null, "db.nuh.pm2"]], baseline: [[null, "db.baseline"]] };
  const DO_LINES = { cgh: ["do.cgh.am", "do.cgh.pm"], parkway: ["do.parkway"], sgh: ["do.sgh.food", "do.sgh.fluids"], nuh: ["do.nuh.am", "do.nuh.pm"], baseline: ["do.baseline"] };
  function timingAnswer(h, q) {
    const before = T_BEFORE.test(q), of = T_OF.test(q), both = before === of, out = [];
    if (before || both) { out.push(t("diet.dayLabel1") + ":"); (DB_LINES[h.dayBefore] || DB_LINES.baseline).forEach(([m, k]) => out.push("• " + (m ? t(m) + ": " : "") + t(k))); }
    if (of || both) { out.push(t("diet.dayLabel0") + ":"); (DO_LINES[h.dayOf] || DO_LINES.baseline).forEach((k) => out.push("• " + t(k))); }
    return out.join("\n");
  }
  let lastKind = "food";                                     // "food" answers come from the food list; "route" answers send the patient elsewhere
  function localAnswer(q, state, faq) {
    const h = hospital(state.profile.hospital), pp = prefProfile(state.dietPref), hn = shortHospital(h);
    const lines = (ids) => ids.map(byId).filter(Boolean).map((f) => answerLine(f, h, pp)).join("\n");
    const lead = h.status === "pending" ? t("st.pending") : t("la.lead", { hospital: hn });
    const call = h.phone ? t("rd.call", { label: h.phoneLabel || h.name, phone: h.phone }) : t("rd.callGeneric");
    const route = (msg) => { lastKind = "route"; return msg; };
    lastKind = "food";
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
    const text = String(q || "");
    if (URGENT.test(text)) return route(t("la.urgent") + "\n" + call);
    if (PURG.test(text) && PURG_EASE.test(text)) return localAnswer("", state, 7);
    if (PROC.test(text)) return route(t("la.outside") + " " + t("la.scope") + "\n" + call);
    if (HEALTH.test(text) || isMedQ(text)) return route(t("la.askDoctor"));
    if (PURG.test(text)) return route(t("db.purg") + "\n" + call);
    if (SLIP.test(text)) return localAnswer("", state, 6);
    if (COLOUR_WHY.test(text)) return localAnswer("", state, 5);
    if (TIMING.test(text)) return lead + "\n" + timingAnswer(h, text);
    const a = analyse(text);
    if (a.exact || a.foods.length) {
      if (a.grey) return t("la.none", { hospital: hn });
      if (a.foods.length) return lead + "\n" + lines(a.foods);
    }
    if (CLEAR_Q.test(text)) return localAnswer("", state, 4);
    if (PROTEIN_Q.test(text)) return localAnswer("", state, 2);
    if (FOOD_INTENT.test(text) || FOOD_WORDS.test(text)) return a.words ? t("la.none", { hospital: hn }) : "→ " + t("nav.diet") + ": " + t("diet.prompt");
    return route(t("la.outside") + " " + t("la.scope"));
  }

  window.CA = {
    setUser, getSession, setSession, CATS, dietList, clearOnlyDay, prefProfile, localAnswer, findFoods,
    LANGS, load, save, wipe, setLang, t, lang: () => lang, foodName,
    parseDate, iso, addDays, today, daysUntil, fmtDate, fmtDateTime,
    hospital, shortHospital, conditionFlags, medFlags, hasFluidCaution, hasDiabetes, exclusion,
    foodStatus, modsFor, checkFood, buildPlan, proteinIdeas, excludedByAllergy,
    prepDates, dayTotal, fluidPct, readiness, stoolClass,
    doses, nextDose, hospitalSchedule, waMessage, waLink, firstName, chatRules, answerKind: () => lastKind
  };
})();
