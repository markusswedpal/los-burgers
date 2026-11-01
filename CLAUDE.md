# LO's Burgers: working rules for Claude

A mobile browser game (three.js, one self-contained `index.html`, hosted on GitHub Pages).

## Content is data, mechanics are code

```
content/   skins.json  events.json  themes.json   <- what things look like and when they happen
src/
  game/    mechanics, scoring, saving, audio, leaderboard (Supabase), game loop
  render/  three.js world, models, weather and lighting
  ui/      shell.html (HTML + CSS), screens, shop, input
tools/     build.py, validate_content.py, preview.py, test_validate.py
.claude/skills/add-skin-or-event/   the questionnaire for kids
index.html, sw.js                  BUILT OUTPUT. Never edit by hand.
```

- Build: `python3 tools/build.py` (validates content, concatenates `src/manifest.json` order, inlines content, updates the offline cache name in `sw.js`).
- Check content only: `python3 tools/validate_content.py [--against origin/main]`.
- The game also re-checks content at runtime (`cleanSkins`, `cleanTheme`, `cleanEvents` in `src/game/`): anything out of range is clamped or dropped.

## If you are helping a child add a skin, event or theme

Use the **add-skin-or-event** skill. Only `content/*.json` may change (plus the rebuilt `index.html`
and `sw.js`), on a branch named `content/...`, through a pull request. Never edit `src/`, `tools/`,
`.github/` or `.claude/` in that job, and never weaken the validator. Requests that change how the game
plays are for a grown-up.

## If you are changing the game itself (grown-up work)

- Mechanics stay in `src/`. Do not move gameplay numbers into content. Themes pick a named `FEEL` (in `src/game/seasons.js`), they never carry raw physics values.
- Adding a new allowed part, effect, card style, icon or feel means: code in `src/`, the same name in `tools/validate_content.py`, and the list in `.claude/skills/add-skin-or-event/reference.md`.
- Run `python3 tools/test_validate.py` and `python3 tools/build.py`, commit `index.html` and `sw.js` with the change.
- Supabase: public table `public.scores`; SQL files live in `supabase/`.
