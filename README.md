# Colonaid

Colonoscopy prep guidance for patients in Singapore, in English, 中文, Bahasa Melayu and தமிழ். Built for HackitRx 2026.

**Live app:** https://colonaid.github.io

## What it does

| Tab | What the patient gets |
|---|---|
| Home | A day-by-day timeline of the three prep days and the procedure day. |
| Diet | What they can and cannot eat on each prep day, by food category, checked against their own hospital's instructions. Filters for vegetarian, lacto-ovo, eggetarian, vegan, halal and gluten-free. A "Can I eat this?" search covers 142 foods and drinks, including local dishes such as chwee kueh, mee soto, putu mayam and thosai. |
| Ask | Eight one-tap common questions, plus free-text questions about food and drink. Medicine questions are declined with "confirm every medicine with your doctor or endoscopy team", and red-flag symptoms are sent to the hospital or A&E. |
| Purgative | The patient enters their dose exactly as prescribed (Colonaid never pre-fills or changes a dose) and gets a reminder schedule to send to their own or a family member's WhatsApp. |
| Ready? | On the procedure date, three questions (purgative taken, stool colour, stool form) give a green, amber or red indicator from three fixed rules shown on screen. Amber and red tell the patient to contact their hospital or clinic now. The hospital always gives the go-ahead. |

## Hospitals

| Guidance used | Hospitals |
|---|---|
| The hospital's own instructions | CGH, SKH, SGH, NCCS, NUH, Parkway East |
| Parkway group sheet | Mount Elizabeth (Orchard), Mount Elizabeth Novena, Gleneagles |
| Baseline from dietitian answers, until the hospital's sheet is added | NCIS, NTFGH, TTSH, KTPH, Raffles, Farrer Park, Mount Alvernia, Thomson Medical Centre, other |

Where a hospital's sheet doesn't mention a food, Colonaid doesn't guess. The food is shown as "Not on your hospital's list — best avoided". The source and date of each hospital's guidance are recorded in `hospitals.js`.

## How the readiness indicator works

1. **Red** if the stool is not ready, or the purgative was missed or not finished.
2. **Green** if the stool is ready and the full purgative was taken on time.
3. **Amber** for everything else.

The stool result is the worse of colour (a five-step reference chart) and form (the Bristol Stool Form Scale, where only Type 7, watery, counts as ready). The indicator is not a clearance: the hospital or clinic decides.

## What is simulated in this demo

- **Sign-in:** six demo numbers. The one-time code is shown on screen instead of being sent by SMS.
- **Reminders:** "Open in WhatsApp" puts the schedule into a chat. Automatic timed messages need the WhatsApp Business Platform.
- **AI answers:** the Ask tab also has an AI mode, which only runs inside the Claude environment the prototype was built in. On this public site every answer comes from the built-in food table and is labelled "Answered from Colonaid's food list".

## Privacy

There is no server. The app itself makes no network requests; fonts load from Google Fonts. Everything a patient enters stays in their own browser, stored separately for each phone number, and "Erase my data" deletes it. There are no photos: stool is described by choosing from reference pictures.

## Changes from earlier versions

- The readiness check went from five questions to three. Clinicians told us finishing the purgative on time is what decides a clean bowel, so the diet and fluid questions were dropped.
- Stool questions moved from text options to reference pictures: a colour chart and the Bristol scale.
- Setup went from about a dozen fields to three: name, colonoscopy date and hospital.
- The Diet tab changed from a generated three-day meal plan to "can eat" and "avoid" lists by prep day and food category.
- The Fluids tab was removed.
- The Ask tab now works without AI, so anyone opening the public link gets an answer.
- Before judging: medicine and symptom questions in Ask no longer get "avoid it for now", the readiness and Ask disclaimers now describe how they actually work, Milo and Horlicks are tagged as containing dairy, and the tab bar layout was fixed.

## Run it locally

No build step. From this folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

---

Colonaid suggests; your care team decides. Always follow your hospital's instructions.
