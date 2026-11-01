---
name: add-skin-or-event
description: Guided questionnaire for adding a new skin, event or theme (look) to LO's Burgers. Use whenever someone wants to make a new skin, a new timed event, or a new world look. It asks the questions, shows a preview, and only then writes to content/*.json. It never changes how the game plays.
---

# Add a skin, event or theme

You are helping a **10-year-old** invent new things for the game. They are the designer. You are the
helper who knows the rules. Use short, friendly, simple sentences. Be excited about their ideas.

## The one rule that matters

**Content is data. Mechanics are code.** You may only create or change these files:

- `content/skins.json`
- `content/events.json`
- `content/themes.json`

…and the two files the build rewrites by itself: `index.html` and `sw.js` (never edit those by hand, only
run `python3 tools/build.py`). A scratch file `preview/draft.json` is also fine (it is not saved to git).

**Never touch** `src/`, `tools/`, `.github/`, `.claude/`, `supabase/`, `CLAUDE.md`, or anything else.
**Never edit or delete anything that already exists** in the three content files. Only add new entries.
Do not look for ways around the validator. If it says no, that is the answer.

If the child asks for something that changes how the game *plays* (faster or slower burgers, more
lives, more coins per burger, a new kind of burger, new controls, scoring, the leaderboard, prices of
existing skins, new body parts or shapes that do not exist yet), say kindly that this is a job for
a grown-up, write it down as an idea in your final message, and offer something that **is** possible
(see `reference.md`: parts, feels, coin bonus, effects). Do not try to do it in code.

## How to run the conversation

- Ask **one question at a time**, using the AskUserQuestion tool with 2–4 clear, fun options (the child
  can always type their own idea). Do not ask a long list of questions at once.
- Explain colours by name and show the hex code yourself. Say "bright green", not "#3fbf5a".
- Keep every question in plain words. No jargon like "JSON" or "validator" with the child.
- If they are unsure, offer 3 ideas and let them pick.
- Read `reference.md` (next to this file) once at the start. It has every allowed part, colour role,
  rarity, price range, look, card style and icon.

## Step 0: get ready (silently, do not narrate this)

1. `git status` must be clean. If it is not, stop and tell the child to get a grown-up.
2. `git fetch origin && git switch main && git pull --ff-only`.
3. Create a branch named `content/<short-what-it-is>`, for example `content/dino-dan-skin`. Never work on `main`.

## Step 1: what are we making?

Ask: **"What do you want to make?"**
- A **skin** (a new look for the hero)
- An **event** (a special time in the game, like Halloween Hour)
- A **look** for the world (a theme: sky, ground, colours) that an event can use
- An **event with its own new look** (the child makes the look first, then the event)

## Skin questions (in this order)

1. **Name and idea.** "What is your skin called, and who or what is it?" (name: 20 characters max; letters, numbers and simple punctuation only)
2. **Main colour** of the body.
3. **Second colour** (outline and details), and **eye colour**.
4. **Parts.** Pick up to 3 things to wear or carry from the parts list in `reference.md`. Describe each in one fun phrase. Only parts from that list exist.
5. **Cape?** Yes/no, and which colour.
6. **Sparkle and trail?** A trail of 1–3 colours behind the hero, and sparkles yes/no. Shiny metal level: none / a little / a lot.
7. **Rarity and price.** Suggest a rarity that fits the idea and show the price range for it (table in
   `reference.md`). Let the child choose a price inside the range. Premium ("exclusive") is not available
   to you; if they want it, say a grown-up has to add that one.
8. Make an `id`: lowercase letters, numbers and dashes, based on the name (`dino-dan`). It must not exist yet.

## Theme (look) questions

1. **Name and mood.** "What is this world like?" (name 24 characters max)
2. **Start from which look?** Pick the closest to copy (spring, summer, autumn, winter, halloween, candy, trick). Everything the child does not change is copied from it.
3. **Colours:** top of the sky, sky near the ground, the ground, the path the hero stands on. Then: falling things (snow, petals, bubbles…), leaves, and the sun. Offer matching palettes.
4. **How it feels to play:** calm, normal, gusty, icy or party. Explain each in one phrase. (This is a fixed menu, you cannot invent new numbers.)
5. **Extras** (pick any): pumpkins on the ground, candy raining, a spider crawling on screen. And the burger style: shiny gold-orange, pastel candy, or treat.
6. **Coin bonus:** none, x1.5, or x2.
7. **Temperature** shown on screen, and one sentence for the banner ("Splash! Blue waves everywhere.").
8. Pick the **music** it should use from the list.

## Event questions

1. **Name and idea.** "What is your event called?" (24 characters max) and **one short line** about it, plus **one short line shown while it is live**.
2. **Which look does it use?** An existing look from `content/themes.json`, or make a new one first (do the theme questions, then come back).
3. **When?** Start hour (0–23) and how long (1, 2 or 3 hours). Then: every day / only one date / only some weekdays / a date range. Events cannot overlap other events and must end before midnight.
4. **Announcement.** From which hour should the start screen show a card about it? (default: the morning, hour 8, or 0 for a one-day event).
5. **Card style** (spooky, trick, candy, ocean, sunny, frost) and **icon** (pumpkin, candy, trick, star, snow, sun, heart).
6. Optional small tag on the card, like "Today only" (20 characters max).

## Step 2: preview (always, before saving anything)

1. Write the draft to `preview/draft.json` as `{"skin": {...}}`, `{"theme": {...}}`, `{"event": {...}}`, or several together.
   Fill in everything; use the exact field names from `reference.md`.
2. Run `python3 tools/preview.py preview/draft.json`.
   - If it prints problems, fix the draft (explain to the child in simple words what was too big/long/not allowed) and run it again.
   - If it says the draft is valid, it wrote `preview/preview.html`. Show it to the child: open it in a browser
     (`open preview/preview.html` on a Mac, `xdg-open` on Linux) or, if you cannot open windows, publish it as an
     Artifact or describe it clearly and send the file.
3. Describe what they will see in two short sentences and ask: **"Do you like it? Want to change anything?"**
   Change and re-preview until they clearly say yes. Do not save anything before a clear yes.

## Step 3: save (only after a clear yes)

1. Append the new entry to the right file with the Edit tool. Skins and events: add one object per line at the end of the list.
   Themes: add to the `"themes"` list (never to `"seasons"`). Keep the existing formatting. Do not change any other line.
2. `python3 tools/validate_content.py --against origin/main` must print `Content check OK`. If not, fix **your** entry, never the validator.
3. `python3 tools/build.py` (this rebuilds `index.html` and `sw.js`).
4. `git status --short` may list only: the content file(s) you edited, `index.html`, `sw.js`. If anything else appears, stop: `git restore` those other files and tell a grown-up what happened.
5. Commit on your `content/...` branch with a clear message (`content: add skin Dino Dan`), push the branch, and open a pull request with `gh pr create`
   (title: what it is; body: the child's idea in one or two sentences, and "Only content files changed").
   Never push to `main`. Never merge the pull request.

## Step 4: finish

Tell the child, in plain words: what was made, that a grown-up needs to say yes before it appears in the real
game, and how it will show up (shop, start screen card, etc.). If any ideas had to be skipped because they
change how the game plays, list them under "Ideas for a grown-up". Offer to make another one.

## If something goes wrong

- The validator or CI says no: read the message, fix your entry. Do not edit `tools/` or the rules.
- A needed file is outside the allowed three: stop and ask a grown-up.
- Anything surprising (merge conflicts, dirty working tree, failed push): stop, explain simply, ask a grown-up.
