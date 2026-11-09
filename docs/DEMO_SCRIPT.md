# Demo video script (2:55)

Target length **2:55** (175s). 1920x1080, 30 fps, light theme, English voiceover,
burned-in captions, visible cursor, slow zoom in/out on every scene.

The same numbers live in `scripts/demo/scenes.json`, which drives the voiceover, the
subtitles and the Playwright recording. Change them in one place.

## Scene table

| Time | On screen | Action | Narration |
| --- | --- | --- | --- |
| 0:00-0:08 | Landing hero | Hold, slow push in | "People don't miss bills because they're careless." / "They miss them because bills arrive as email." |
| 0:08-0:18 | Landing "How it works" | Smooth scroll to `#how`, then back to the top of the section | "Deadline Bill Guard turns a forwarded invoice into a payable bill — then makes sure you never pay a late fee again." |
| 0:18-0:28 | Login | Click `Open the demo` -> `Enter the demo` | "One click opens the demo with twelve bills, five subscriptions, and thirty days of history already loaded." |
| 0:28-0:42 | Dashboard | Hold on the hero, then drift down the stat cards | "This is the one screen that answers what's due, and what's late." / "And how much recurring spend is quietly leaving every month." |
| 0:42-0:55 | Dashboard insights | Scroll to the insight and reminders cards | "Four reminders are scheduled for every bill." / "The subscription radar totals the plans you forgot you were paying for." |
| 0:55-1:02 | Inbox | Click `Inbox` in the sidebar | "Now the part that does the work: the inbox." |
| 1:02-1:16 | Inbox samples | Click `Electric bill`, wait for the toast, scroll to the ingest log | "Forward an invoice, or paste it." / "A classifier decides if it's really a bill. Then an extractor pulls the merchant, amount, currency, due date, and invoice number." |
| 1:16-1:28 | Ingest log | Point at the new `bill` row and the seeded `ignored` promo row | "Promotions are ignored." / "Anything under sixty percent confidence goes to a human review queue, never silently into your bills." |
| 1:28-1:40 | Bill detail | Click `Open` on the new row, then scroll to `Source email` | "Every field is validated with Zod, cross-checked by a deterministic parser, and scored for confidence." / "You can audit the source email." |
| 1:40-1:50 | Reminders | Scroll back up, point at the reminder ladder | "The reminder ladder is scheduled automatically." / "Seven, three, one, and zero days before the due date." |
| 1:50-2:08 | PayPal checkout | Click `Pay $143 with PayPal`, point at the amount, click `Approve payment` | "PayPal isn't bolted on." / "Orders v2 creates the order with the bill id, the payer approves, and the return handler captures the payment." |
| 2:08-2:20 | Bill detail activity | Scroll to `PayPal activity` | "A verified webhook reconciles the capture." / "Every order, capture, and event lands in the bill's audit trail." |
| 2:20-2:32 | Subscriptions | Click `Subscriptions`, point at the recoverable total, then the cancel shortlist | "Subscriptions group themselves." / "The plans you never use become a yearly number you can act on." |
| 2:32-2:43 | Settings | Click `Settings`, scroll to Export, click `Download CSV` | "Everything exports to CSV." / "No bank logins, no scraping. The inbox you already use is the source of truth." |
| 2:43-2:55 | End card | Landing hold, then the navy end card | "Deadline Bill Guard. Forward a bill, get reminded, pay with PayPal." / "Source and setup are on GitHub." |

## Zoom cues

Zoom is continuous and anchored top-centre so the sticky header and sidebar stay
legible. Levels match at every cut, so hard cuts never jump.

- Landing and end card: 1.00 <-> 1.06 (visible, cinematic).
- App screens: 1.000 <-> 1.015 (subtle breathing, no UI is cropped).

## Capture plan

1. Build production and start on port 3100 with a fresh `DBG_DATA_DIR` and
   `AUTH_SECRET`, so the seeded demo is deterministic and the real `.data/` is untouched.
2. Record with Playwright at 1920x1080, 30 fps. The OS cursor is not captured, so a DOM
   cursor + click ripple is injected with `addInitScript`; all moves are real
   `mouse.move` calls with intermediate steps.
3. Trim the browser start-up lead-in, convert to 30 fps, apply the zoom curve, append a
   12 s end card, then burn the ASS captions and mux the voiceover.

## Voice and captions

- Voice: `en-US-AndrewNeural` (edge-tts), `+4%` rate, one clip per caption cue.
- Each clip is placed at its absolute cue time and the bed is padded to 175 s.
- If a clip overruns its slot it is regenerated at `+8%`, `+12%`, `+16%`, `+20%`.
- Captions are ASS (1920x1080 PlayRes), 42 px Segoe UI Semibold, white text on a
  translucent navy box, bottom-centred, with a short fade.

## Recording checklist

- [x] Prevent real PayPal redirect: record in demo mode (no `PAYPAL_CLIENT_ID/SECRET`).
- [x] Fresh seeded store, demo user `usr_demo_0001` (`Enter the demo`).
- [x] `npm run build` before recording (no dev overlay, fastest navigation).
- [ ] Upload the final MP4 to YouTube as **Public**, length under 3:00.
- [ ] Add the YouTube link and a hosted demo URL to `README.md`, then close the
      checklist in `SUBMISSION.md`.
- [ ] No third-party music; only normal PayPal UI usage.
