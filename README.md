# LO’s Burgers

A 3D mobile arcade game. Catch falling burgers through four seasons, skip the burnt ones, and spend coins on skins in the item shop.

- Drag to move. Winter is icy, windy and fast, so it pays x1.5 coins.
- Sven the baby shows up now and then and doubles your coins.
- Three lives, and the game speeds up fast. Burnt burgers cost a life.
- 13 skins in the shop, including four Mythic skins that cost 2,500 to 10,000 coins.
- Shared top 20 leaderboard: add your player name after a run and everyone sees the same list. It runs on a free [Supabase](https://supabase.com) project (`supabase/schema.sql`). If the network is down the game falls back to a board stored on the device.
- Built with [three.js](https://threejs.org/) in a single `index.html`. No build step.

## Play on iPhone

Open the GitHub Pages link of this repo in Safari, tap Share, then **Add to Home Screen**. It opens full screen and works offline after the first launch.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole game |
| `manifest.webmanifest` | Home Screen name, colors and icons |
| `sw.js` | Service worker for offline play |
| `icons/` | Launcher icons (180, 192, 512 px) |
| `icon.svg` | Icon source |
| `supabase/schema.sql` | Leaderboard table and the `submit_score` function |
