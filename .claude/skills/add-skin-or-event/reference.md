# Reference for the add-skin-or-event skill

The validator (`python3 tools/validate_content.py`) is the final judge. This file explains the choices.

## Skins: `content/skins.json`

One object per skin:

```json
{"id":"dino-dan","name":"Dino Dan","rarity":"epic","price":700,
 "body":"#3fbf5a","accent":"#145a28","eye":"#fff3a8","acc":"spikes+horns","c2":"#ff9a2a",
 "cape":"#ff4f8b","trail":["#7dff9a","#ffffff"],"sparkle":true,"metal":0.4}
```

| field | meaning |
|---|---|
| `id` | lowercase letters, numbers, dashes. 2-24 characters. Unique. |
| `name` | up to 20 characters. Letters, numbers, spaces and . , ! ? ' : + % / - |
| `rarity` | common, rare, epic, legendary, mythic (exclusive is for grown-ups) |
| `price` | whole number, must fit the rarity (below) |
| `body` | main body colour |
| `accent` | outline / hair colour / details |
| `eye` | eye colour |
| `c2` | second colour used by parts (bandana, ring, bow, coins) |
| `acc` | parts joined with `+`, at most 4. Only from the list below |
| `cape` | optional colour of a cape |
| `trail` | optional, 1-3 colours left behind the hero |
| `sparkle` | optional true/false |
| `metal` | optional 0 to 1, how shiny and metallic (0.3 a little, 0.6 a lot, 0.9 mirror) |

Colours are always `#` + 6 letters/numbers, like `#ff8800`.

### Parts (`acc`)

headband (a headband with trailing tails) · mohawk (a tall crest) · helmet (a knight helmet) · ninja (a mask)
· shades (cool sunglasses) · horns (two horns) · orbit (little things circling the hero) · crown · halo
(a glowing ring) · wings (angel wings) · hair (hair in the `accent` colour) · quiff (a swoop of hair)
· spikes (spiky hair) · cap (a cap) · headphones · ponytail · pigtails · bow · diamonds (gems on the hero)
· coins (floating coins)

No other parts exist. New shapes need a grown-up to build them in code.

### Rarity and price

| rarity | price range (coins) |
|---|---|
| common | 40 - 300 |
| rare | 100 - 600 |
| epic | 300 - 1000 |
| legendary | 800 - 3000 |
| mythic | 2000 - 10000 |
| exclusive | grown-ups only |

## Themes (looks): `content/themes.json`

Add new looks under `"themes"` (never under `"seasons"`). Start from another look with `"extends"` so you only write what changes:

```json
{"id":"ocean-day","extends":"summer","name":"Ocean Day","note":"Splash! Blue waves everywhere.","temp":24,
 "color":"#35e0c0","skyTop":"#0a5fc0","skyBot":"#9ff0ff","ground":"#e8d9a0","lane":"#7fd6e8","pColor":"#ffffff",
 "feel":"calm","coinBonus":1.5,"effects":[],"burgers":"shiny","music":"summer"}
```

Look ids to extend: spring, summer, autumn, winter, candy, superburger (or any look added later).

### Colour roles

`color` (name colour on the banner) · `skyTop` (top of the sky) · `skyBot` (sky near the ground) · `fog` (distance haze, usually like skyBot)
· `ground` (grass beside the lane) · `lane` (the path) · `mount` (mountains) · `foliage` (leaves) · `trunk` (tree trunks)
· `cloud` · `sun` · `pColor` (falling things: snow, petals, bubbles) · `hemiSky`/`hemiGnd` (soft light from above/below)
· `dir` (sunlight colour) · `rim` (edge glow).

Number fields you may change (all optional, with their allowed range): `sunY` 0-60 (how high the sun is) · `sunS` 0.3-3 (sun size)
· `pFall` -2 to 5 (how fast the falling things move) · `pSize` 0.05-0.6 · `pAlpha` 0-1 · `fogNear` 20-120 · `fogFar` 100-400
· `foliageScale` 0.5-1.5 · `laneRough` 0-1 (0 = glassy, 1 = matte) · `cold` 0-1 (1 = ice and snow look) · `hemiI`, `dirI`, `rimI` 0-2 (light strength).

### Fixed menus (these cannot be invented)

- `feel` (how the lane and wind behave): `normal`, `calm` (slow burgers, no wind), `gusty` (wind), `icy` (slippery and fast), `party` (the event feel)
- `coinBonus`: 1, 1.5 or 2
- `effects`: any of `pumpkins`, `candies`, `spider`
- `burgers`: `shiny` (gold-orange), `candy` (pastel), `treat` (orange and pink)
- `music`: spring, summer, autumn, winter, halloween, candy, trick
- `temp`: -30 to 40 (shown on screen only)
- `name` up to 24 characters, `note` up to 120, `short` up to 12 (leaderboard label)

## Events: `content/events.json`

```json
{"key":"ocean-day","theme":"ocean-day","name":"Ocean Day","h":16,"len":1,"weekdays":[0,6],"pre":10,
 "sub":"Blue waves and coins x1.5","liveSub":"Splash! Coins x1.5","card":"ocean","icon":"sun"}
```

| field | meaning |
|---|---|
| `key` | unique id (lowercase, numbers, dashes) |
| `theme` | the `id` of a look in themes.json (not a season) |
| `name` | up to 24 characters |
| `h`, `len` | start hour 0-23 (the player's clock), lasts 1-3 hours, must end before midnight |
| when | nothing = every day · `date` "2026-12-24" = one day · `from`/`to` = date range · `weekdays` [0-6], 0 = Sunday · `skip` ["2026-12-24"] = days off |
| `pre` | hour the start-screen card appears before the event (0 up to `h`) |
| `sub` | line on the card before it starts (80 characters) |
| `liveSub` | line while it is on (80 characters) |
| `tag` | optional small label, 20 characters, like "Today only" |
| `card` | spooky, trick, candy, ocean, sunny, frost |
| `icon` | pumpkin, candy, trick, star, snow, sun, heart |

Two events may not be on at the same time. During an event all burgers are shiny, blue and pink burgers
appear, and the coin bonus of the look applies. That part is fixed game behaviour.

## What a child cannot change (grown-up jobs)

Speed, gravity, lives, scoring, burger types, controls, boss, power-ups, leaderboard, prices of existing
skins, new body parts or shapes, new weather, new music tracks, new card styles or icons.
