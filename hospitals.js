/* Colonaid — hospital knowledge base (v1)
   Each hospital's rules mirror ITS OWN prep sheet. Where a sheet is silent the rule is "ask",
   and the diet plan never suggests "ask" foods. Hospitals without a sheet on file use the
   conservative SG baseline (strictest common rules across the sheets we hold).
   Rule values: "yes" | "no" | "ask" | "lowfat" (dairy only, controlled portions).
   Sources: SKH diet-advice page; CGH "Preparing for Colonoscopy" brochure (valid Jun 2026);
   Parkway Pantai generic gastroscopy/colonoscopy sheet; Parkway East dietitian response (Sep 2026). */

window.CA_RULESETS = {
  nuh: {
    dairy: "no", malted: "no", coffeetea: "yes", soymilk: "no", banana: "no", potato: "yes",
    cookedveg: "no", strainedvegsoup: "no", mushroom: "no", redmeat: "no", smoothnut: "no",
    chweekueh: "ask", kaya: "ask", sotomod: "yes", tauhuay: "no",
    juice: "no", cereal: "no", prata: "ask", eggstyle: "yes", jelly: "no", butter: "no", plantmilk: "no",
    // NUH names what IS allowed; anything else ("ok" by default) is shown as "check with your hospital"
    allow: ["congee", "kwayteownoodle", "meesuanoodle", "vegbroth", "whiterice", "whitebread", "noodles", "egg", "fish", "chicken", "potato", "eggtoast", "scrambled", "fishcongee", "chickencongee", "eggcongee", "chickenrice", "fishsoup", "steamedfish",
      "kwayteow", "meesua", "steamedegg", "potatofish", "chickenporridgemalay", "sotoayam", "yam",
      "kopio", "plainteac", "water", "clearbroth", "honeywater", "glucosewater"],
    // "nuts and beans products", "barley", "jelly and agar agar" are on NUH's not-allowed list
    deny: ["tofu", "taukwa", "taupok", "proteinpowder", "tofucongee", "tofurice", "mockmeat", "potatotofu", "ricetofuegg", "tauhuay", "soymilk", "barley", "jelly", "icepop", "pbtoast"]
  },
  sgh: {
    dairy: "no", malted: "no", coffeetea: "yes", soymilk: "no", banana: "no", potato: "yes",
    cookedveg: "no", strainedvegsoup: "no", mushroom: "no", redmeat: "no", smoothnut: "ask",
    chweekueh: "ask", kaya: "yes", sotomod: "yes", tauhuay: "ask",
    juice: "no", cereal: "no", prata: "yes", eggstyle: "ask", jelly: "ask", butter: "yes", plantmilk: "no"
  },
  skh: {
    dairy: "no", malted: "no", coffeetea: "no", soymilk: "no", banana: "no", potato: "no",
    cookedveg: "no", strainedvegsoup: "no", mushroom: "no", redmeat: "no", smoothnut: "no",
    chweekueh: "ask", kaya: "ask", sotomod: "yes", tauhuay: "ask",
    juice: "yes", cereal: "yes", prata: "ask", eggstyle: "yes", jelly: "ask", butter: "ask", plantmilk: "ask"
  },
  cgh: {
    dairy: "ask", malted: "yes", coffeetea: "yes", soymilk: "ask", banana: "no", potato: "no",
    cookedveg: "no", strainedvegsoup: "no", mushroom: "no", redmeat: "ask", smoothnut: "no",
    chweekueh: "ask", kaya: "ask", sotomod: "yes", tauhuay: "yes",
    juice: "ask", cereal: "ask", prata: "ask", eggstyle: "yes", jelly: "ask", butter: "ask", plantmilk: "ask"
  },
  parkway: {
    dairy: "yes", malted: "no", coffeetea: "yes", soymilk: "yes", banana: "yes", potato: "yes",
    cookedveg: "yes", strainedvegsoup: "yes", mushroom: "yes", redmeat: "yes", smoothnut: "yes",
    chweekueh: "ask", kaya: "ask", sotomod: "yes", tauhuay: "yes",
    juice: "yes", cereal: "ask", prata: "ask", eggstyle: "yes", jelly: "ask", butter: "yes", plantmilk: "ask"
  },
  parkwayeast: {
    dairy: "lowfat", malted: "yes", coffeetea: "yes", soymilk: "yes", banana: "no", potato: "yes",
    cookedveg: "no", strainedvegsoup: "yes", mushroom: "no", redmeat: "yes", smoothnut: "ask",
    chweekueh: "no", kaya: "yes", sotomod: "yes", tauhuay: "yes",
    juice: "yes", cereal: "ask", prata: "ask", eggstyle: "yes", jelly: "ask", butter: "ask", plantmilk: "ask"
  },
  // Hospitals without a loaded sheet: dietitian answers (Singapore Cancer Society, Parkway East, workgroup dietitian)
  baseline: {
    dairy: "yes", malted: "yes", coffeetea: "yes", soymilk: "yes", banana: "no", potato: "yes",
    cookedveg: "no", strainedvegsoup: "no", mushroom: "no", redmeat: "no", smoothnut: "yes",
    chweekueh: "ask", kaya: "yes", sotomod: "yes", tauhuay: "yes",
    juice: "yes", cereal: "yes", prata: "ask", eggstyle: "yes", jelly: "yes", butter: "yes", plantmilk: "ask"
  }
};

/* status: "verified" = hospital's own sheet loaded; "group" = shared group sheet, confirm with
   hospital; "pending" = sheet requested, conservative baseline in use.
   dayBefore: "cgh" | "parkway" | "skh" | "baseline"  (see app.js for what each renders)
   dayOf:     "cgh" | "parkway" | "baseline" */
window.CA_HOSPITALS = [
  { id: "cgh", name: "Changi General Hospital (CGH)", type: "public", status: "verified", rules: "cgh",
    lrDays: 3, dayBefore: "cgh", dayOf: "cgh", purgative: "PEG-ES", purgHint: "pg.hint.cgh",
    phone: "6936 5324", phoneLabel: "CGH Digestive Diseases Centre (Mon–Fri 8.30am–5pm)",
    sourceNote: "CGH 'Preparing for Colonoscopy' brochure, valid as of June 2026",
    kb: "3 days before: low residue diet (white bread, white rice, pasta, tofu). Do NOT take vegetables, fruits, nuts and seeds, whole grain cereal. Day before: breakfast white bread, egg and plain drink (coffee/tea/Milo without milk); lunch light soft diet e.g. congee or noodle soup; dinner clear broth/soup and drinks without any milk. Clear soup/drinks allowed till midnight. Purgative: PEG-ES, 1 packet in 1 litre water, drink one 250 ml mug every 15 minutes, finish each litre in 1 hour; a little cordial syrup may be added for flavour. Morning appointment (before 1pm): plain water only, second dose from 4/5/6am, stop drinking 2 hours before. Afternoon appointment: light breakfast allowed (1 slice plain bread OR 2 plain biscuits OR small bowl plain pasta), stop eating 6 hours before, stop drinking 2 hours before. Bowel movement may start 30 min to 3 hours after drinking PEG-ES. Do not take diabetic medication on the day." },
  { id: "skh", name: "Sengkang General Hospital (SKH)", type: "public", status: "verified", rules: "skh",
    lrDays: 3, dayBefore: "skh", dayOf: "baseline",
    sourceNote: "SKH 'Preparing for colonoscopy — diet advice' page",
    kb: "Low residue diet for 3 days before. Allowed: white rice/porridge, white bread, plain biscuits, egg noodles, idli, iddiyappam (putu mayam), rice cereal; fish, chicken, pork, eggs, shellfish e.g. prawns, tofu, taukwa, vegetarian mock meat. Avoid: brown rice, wholemeal/wholegrain bread and biscuits, chapatti, oats; red meat e.g. beef and mutton, tempeh, beans, lentils, nuts and seeds, yoghurt, cheese; ALL fruits and vegetables. Fluids allowed: water, clear soup, light coloured juice e.g. apple/pear, colourless soft drinks e.g. Sprite/7-Up/cream soda. Fluids to avoid: milk, soy milk, yoghurt drinks, cream soup, malted drinks e.g. Milo/Horlicks, dark coloured liquids e.g. coffee/tea, grape juice, prune juice, red coloured liquids e.g. tomato juice." },
  { id: "mea", name: "Mount Elizabeth Hospital (Orchard)", type: "private", status: "group", rules: "parkway",
    lrDays: 5, dayBefore: "parkway", dayOf: "parkway",
    sourceNote: "Parkway Pantai generic gastroscopy/colonoscopy sheet — your specialist may vary it",
    kb: "Adjust diet from 5 days before. Consider: well-cooked vegetables without seeds (green beans, mushrooms, peeled potatoes), bananas, canned fruit without skin, vegetable/fruit juices without skin, seeds or pulp, cream-based soups; small lean cuts of beef, chicken or lamb, fish; white rice or porridge, pasta with <1g fibre per serving; butter, margarine, mayonnaise, cream. Avoid: broccoli, peas, bean sprouts, raw/leafy vegetables, berries, raisins, figs, seeds and nuts including crunchy peanut butter, juices with pulp; smoked or cured meats; whole grain bread, cereal, crackers, brown rice; drinks with added malt; fried and fatty foods, tough or processed meats. Day before: liquid-only diet — plain water, sports drinks, clear broths; avoid cream-based foods and drinks like smoothies and porridge. Morning procedure: switch at least 8 hours prior or the night before. Afternoon procedure: begin liquid diet on waking. Some doctors split the laxative: half in the evening, the rest 6 hours before. No food or drink (even water) from 2 hours before the scope. Taste tips: mix laxative with a sports drink, flavour with ginger or lime, take it chilled, sip through a straw." },
  { id: "men", name: "Mount Elizabeth Novena Hospital", type: "private", status: "group", rules: "parkway",
    lrDays: 5, dayBefore: "parkway", dayOf: "parkway",
    sourceNote: "Parkway Pantai generic sheet (to confirm with the hospital)", kbRef: "mea" },
  { id: "gle", name: "Gleneagles Hospital", type: "private", status: "group", rules: "parkway",
    lrDays: 3, dayBefore: "parkway", dayOf: "parkway",
    sourceNote: "Parkway Pantai generic sheet; Gleneagles info page says 2–4 days low fibre", kbRef: "mea" },
  { id: "pke", name: "Parkway East Hospital", type: "private", status: "verified", rules: "parkwayeast",
    lrDays: 3, dayBefore: "parkway", dayOf: "parkway",
    sourceNote: "Parkway East dietitian guidance (Sep 2026) + Parkway generic sheet",
    kb: "Parkway East dietitian: banana and avocado are NOT allowed. Low-fat/skimmed milk, low-fat yoghurt/cheese permitted in controlled portions. Milo and kaya toast (white bread) are generally low residue. Laksa not suitable (coconut milk, cockles, bean sprouts). Mee soto acceptable only with vegetables, beansprouts and garnishes removed. Chwee kueh not suitable. Protein for vegetarian/vegan/halal/Indian-vegetarian: egg, tofu, taukwa, milk, yoghurt, cheese, soy milk or nutrition supplements. All vegetables not allowed, except potatoes without skin; strained vegetable soups or strained vegetable juices are allowed. Day before and day of: Parkway generic sheet (liquid-only day before; nothing by mouth 2 hours before)." },
  { id: "sgh", name: "Singapore General Hospital (SGH)", type: "public", status: "verified", rules: "sgh",
    lrDays: 3, dayBefore: "sgh", dayOf: "sgh", purgative: "PICOPREP", purgHint: "pg.hint.picoprep",
    extraMods: { mockmeat: ["nogluten"], prata: ["whitesugar"], thosai: ["whitesugar"], putumayam: ["whitesugar"] },
    sourceNote: "SGH / NCCS 'Dietary Advice & PICOPREP Bowel Preparation Instructions' sheet (English & Chinese)",
    kb: "SGH / NCCS 'Dietary Advice & PICOPREP Bowel Preparation Instructions' sheet (English and Chinese versions). Low residue diet for 3 days. CAN EAT — staple food: plain white bread or biscuit (can put kaya or butter spread); porridge (fish/chicken), white rice; plain pasta/noodles (non wholegrain); plain kway teow / mee sua / bee hoon soup; plain thosai / prata / idiyappam (putu mayam) with white sugar only. Mains: plain tofu, fish, chicken, pork, seafood, eggs (boiled, poached); vegetarian mock meat (no gluten); potato (no skin); yam (no skin). CANNOT EAT: fruits, vegetables, brown rice, cereal, oats, wholemeal bread, fried food, red meat (beef, mutton, duck). CAN DRINK: plain water; barley water (without barley pearls); honey / glucose water; coffee (no milk); tea (no milk); colourless soft drinks e.g. 100Plus, Pocari, Sprite, 7-Up; clear soup (no vegetables). CANNOT DRINK: fruit juices, Milo, Ovaltine, alcoholic beverages, milk products (cow, goat, soy, almond, oat). EVE OF SCOPE: dinner at the date/time on the sheet; NO FOOD AFTER DINNER. Bowel prep: PICOPREP — 1 packet mixed with 150 ml of water, followed by 1 litre of clear fluid; up to 4 packets with date/time filled in by the clinic (on the eve and/or the day of scope). DAY OF SCOPE: breakfast either NO FOOD ALLOWED, or ONLY plain white bread x2 (no kaya, butter, jam) OR plain biscuits x2 (no fillings); can drink plain water, tea 'O' + sugar; NO FOOD AFTER BREAKFAST. Notes: after drinking PICOPREP you will pass motion. Drinks recommended for hydration: plain water, glucose water, 100Plus. Clear fluids (maximum 200 ml) allowed up to 2 hours before the procedure. Oral medication to be taken at 6am; you may bring along your medication. Stop drinking from the time on the sheet. If hungry/dizzy, may consume white colour sweets e.g. Mentos/Polo; if thirsty, rinse mouth with water or suck some ice cubes. For medication advice, refer to the General Advice document. PICOPREP is chargeable whether or not the scope is cancelled and cannot be refunded or exchanged." },
  { id: "nccs", name: "National Cancer Centre Singapore (NCCS)", type: "public", status: "verified", rules: "sgh",
    lrDays: 3, dayBefore: "sgh", dayOf: "sgh", purgative: "PICOPREP", purgHint: "pg.hint.picoprep",
    extraMods: { mockmeat: ["nogluten"], prata: ["whitesugar"], thosai: ["whitesugar"], putumayam: ["whitesugar"] },
    sourceNote: "SGH / NCCS 'Dietary Advice & PICOPREP Bowel Preparation Instructions' sheet (English & Chinese)",
    kbRef: "sgh" },
  { id: "nuh", name: "National University Hospital (NUH)", type: "public", status: "verified", rules: "nuh",
    lrDays: 3, dayBefore: "nuh", dayOf: "nuh", purgative: "4 laxative packets", purgHint: "pg.hint.nuh",
    videoUrl: "https://www.youtube.com/watch?v=KJad4HZToxc",
    schedule: { am: { day: -1, times: ["19:00", "20:00", "21:00", "22:00"] }, pm: { day: 0, times: ["06:00", "07:00", "08:00", "09:00"] }, glassesPerPacket: 4, stopHours: 4 },
    sourceNote: "NUH 'Preparing for a Colonoscopy at NUH' video (transcript) + NUH website",
    kb: "NUH 'Preparing for a Colonoscopy at NUH' video: low fibre diet for 3 days before the colonoscopy. NOT allowed: fruits, fruit juice and vegetables; red meat like duck, beef and mutton; nuts and beans, and nut and bean products; cereals like oats, wheat and barley; milk and milk products; jelly and agar agar. ALLOWED: simple carbohydrates like white rice, white bread, mee sua, bee hoon, kway teow, potatoes and eggs; white meat like fish and chicken; plain coffee and tea; glucose, honey and clear soup. (Anything not named on these lists: tell the patient NUH's list doesn't cover it and to check with NUH or avoid it to be safe. Tofu, taukwa, soy milk and mock meat are bean products, so they fall under 'not allowed'.) BOWEL PREP: 4 packets of laxative. Mix 1 packet with 1 litre of water, stir well and split into 4 cups (a regular cup is about 250 ml). Drink 1 cup every 15 minutes. Repeat for the other 3 packets over the next 3 hours. Morning colonoscopy: start the evening before — 7pm first packet, 8pm second, 9pm third, 10pm fourth. Afternoon colonoscopy: start the morning of the colonoscopy — 6am first packet, 7am second, 8am third, 9am fourth. The schedule is also written on the packet. NO FOOD once you start the bowel preparation. NO DRINKING 4 hours before the colonoscopy. Tell the nurse about long-term medicines for high blood pressure, diabetes, blood thinning and asthma. DAY OF: report at NUH Endoscopy Centre, Kent Ridge Wing, Level 4, 1 hour before the appointment. Bring appointment letter; NRIC, passport, work permit or employment pass; civil service card or other medical benefit cards; Medisave form signed by the account holder with his or her NRIC; letter of guarantee from employer or insurance company; case and solution for contact lenses if applicable. Do not wear make-up, nail polish or jewellery. After: monitored for 1 hour because of sedation; discharged when fully awake; no operating machinery including driving. NUH website: discuss continuing warfarin, aspirin and diabetes medication with your doctor; incomplete preparation may mean the procedure is rescheduled." },
  { id: "ncis", name: "National University Cancer Institute (NCIS)", type: "public", status: "pending", rules: "baseline", lrDays: 3, dayBefore: "baseline", dayOf: "baseline" },
  { id: "ntfgh", name: "Ng Teng Fong General Hospital (NTFGH)", type: "public", status: "pending", rules: "baseline", lrDays: 3, dayBefore: "baseline", dayOf: "baseline" },
  { id: "ttsh", name: "Tan Tock Seng Hospital (TTSH)", type: "public", status: "pending", rules: "baseline", lrDays: 3, dayBefore: "baseline", dayOf: "baseline" },
  { id: "ktph", name: "Khoo Teck Puat Hospital (KTPH)", type: "public", status: "pending", rules: "baseline", lrDays: 3, dayBefore: "baseline", dayOf: "baseline" },
  { id: "raf", name: "Raffles Hospital", type: "private", status: "pending", rules: "baseline", lrDays: 3, dayBefore: "baseline", dayOf: "baseline" },
  { id: "fph", name: "Farrer Park Hospital", type: "private", status: "pending", rules: "baseline", lrDays: 3, dayBefore: "baseline", dayOf: "baseline" },
  { id: "mah", name: "Mount Alvernia Hospital", type: "private", status: "pending", rules: "baseline", lrDays: 3, dayBefore: "baseline", dayOf: "baseline" },
  { id: "tmc", name: "Thomson Medical Centre", type: "private", status: "pending", rules: "baseline", lrDays: 3, dayBefore: "baseline", dayOf: "baseline" },
  { id: "other", name: "Other / not listed", type: "other", status: "pending", rules: "baseline", lrDays: 3, dayBefore: "baseline", dayOf: "baseline" }
];

window.CA_BASELINE_KB = "Conservative Singapore baseline (hospital sheet not yet loaded): 3 days low residue. Allowed: white rice, white porridge, white bread, plain biscuits, bee hoon, kway teow, egg noodles, refined pasta, idli, thosai, iddiyappam, rice cereal; fish, chicken, pork, eggs, shellfish, tofu, taukwa, mock meat, well-cooked tender lean meat. Avoid: brown/red rice, wholemeal, chapati, naan, vadai, oats, muesli, quinoa, bran; red meat (beef, mutton), tough/deep-fried/processed meat (sausage, lap cheong, salami), tempeh, beans, lentils, dal, nuts, seeds; all fruit with skin, seeds or pulp, dried fruit, coconut; all vegetables including mushrooms, corn, leafy greens; chilli/sambal; garnishes (spring onion, coriander, fried shallots). Dietitian answers: milk, cheese, yoghurt, condensed/evaporated milk, Milo/Horlicks and strained soy milk are allowed on low-residue days but not in the clear-liquid phase; peeled potato, sweet potato and yam are allowed; a thin layer of smooth nut butter and kaya are allowed; flavourings like onion or garlic are fine only when not visible. Day before: clear liquids only. Clear liquids = water, clear strained broth, light-coloured pulp-free juice (apple, pear), plain tea/coffee without milk, isotonic drinks (no colour), honey water, clear jelly. Never red, purple or blue coloured food or drink. Stop all fluids ~2 hours before the procedure unless the hospital says otherwise.";

window.CA_SHARED_KB = "Shared clinical notes: Diet compliance shapes the experience; finishing the purgative on time is what decides a clean bowel. One or two diet slips usually do not ruin preparation if the final output runs clear. Red/purple/blue colours are avoided because they can look like blood during the scope. Flavourings like onion, garlic, ginger, lemongrass are fine in small amounts that are not visible pieces. Soy sauce, oyster sauce, ketchup, mayonnaise are fine without visible vegetable pieces. Processed products (fishball, fishcake, luncheon meat) do not add residue if no seeds/vegetables, but are not the healthiest choice. Milk, soy milk and milky drinks (kopi, teh, teh tarik, Milo, Horlicks) must stop in the clear-liquid phase. Barley water only if strained; in the clear phase only diluted and not cloudy. Prune juice contains fibre — avoid. Orange, tomato, sugarcane, calamansi and coconut drinks may have pulp or seeds — avoid. Protein for vegetarian/vegan: tofu, taukwa, strained soy milk (where allowed), eggs, milk/cheese/yoghurt (where allowed), plant protein powder, mock meat.";
