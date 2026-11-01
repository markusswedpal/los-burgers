# LO’s Burgers

A 3D mobile arcade game. Catch falling burgers through four seasons, skip the burnt ones, and spend coins on skins in the item shop.

- Drag to move. Winter is icy, windy and fast, so it pays x1.5 coins.
- Sven the baby shows up now and then and doubles your coins.
- Three lives, and the game speeds up fast. Burnt burgers cost a life.
- 13 skins in the shop, including four Mythic skins that cost 2,500 to 10,000 coins.
- Shared top 100 leaderboard plus a daily top 10: add your player name after a run and everyone sees the same list. It runs on a free [Supabase](https://supabase.com) project (`supabase/schema.sql`). If the network is down the game falls back to a board stored on the device.
- Built with [three.js](https://threejs.org/). The source lives in `src/` and `content/`; `python3 tools/build.py` produces the single `index.html`.

## Play on iPhone

Open the GitHub Pages link of this repo in Safari, tap Share, then **Add to Home Screen**. It opens full screen and works offline after the first launch.

## Make your own skins and events

New skins, events and world looks are **data**, not code. They live in `content/skins.json`, `content/events.json`
and `content/themes.json`. Mechanics (speed, scoring, lives, leaderboard) live in `src/` and cannot be changed from content.

For a young designer: open this repo in Claude Code and say "I want to make a skin" (or an event). The
`add-skin-or-event` skill asks the questions, shows a preview, and only then writes to the three content files, on a
`content/...` branch and through a pull request. A grown-up reviews and merges it.

Safeguards:
- `tools/validate_content.py` only allows looks and times: colours, names, a fixed list of parts, a price range per rarity,
  fixed "feels" and coin bonuses, events of 1 to 3 hours that cannot overlap. Raw speeds and physics are refused.
- The game re-checks all content when it loads and clamps or drops anything out of range.
- The `content-check` workflow runs on every pull request: rules tests, content check, "existing entries unchanged",
  "`content/` branches may only touch content files", and "`index.html` equals the build".
- Suggested repo settings (GitHub, Settings, Branches): protect `main`, require a pull request, require the `content-check`
  status check and a code-owner review (`.github/CODEOWNERS`). Give the young designer a collaborator account without admin rights.

## Folders

| Path | Purpose |
|---|---|
| `content/` | Skins, events and themes (data) |
| `src/game/` | Mechanics, scoring, saving, audio, leaderboard, game loop |
| `src/render/` | three.js world, models, weather, lighting |
| `src/ui/` | HTML and CSS shell, screens, shop, input |
| `tools/` | `build.py`, `validate_content.py`, `preview.py`, `test_validate.py` |
| `.claude/skills/add-skin-or-event/` | The questionnaire skill |
| `index.html`, `sw.js` | Built output (do not edit by hand) |
| `manifest.webmanifest`, `icons/`, `icon.svg` | Home Screen app files |
| `supabase/` | Leaderboard SQL |
