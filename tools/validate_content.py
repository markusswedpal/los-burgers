#!/usr/bin/env python3
"""Checks content/*.json before it can reach the game.

Content is data, mechanics are code: this script only lets the JSON files describe how things
LOOK (colours, names, parts, times). It refuses anything that could change how the game PLAYS.

  python3 tools/validate_content.py                  check the three files
  python3 tools/validate_content.py --against REF    also check that nothing that already
                                                     exists in git REF was changed or removed
Exit code 0 = fine, 1 = problems (each one is printed in plain English).
"""
import json, re, sys, subprocess, datetime, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HEX = re.compile(r'^#[0-9a-fA-F]{6}$')
ID = re.compile(r'^[a-z0-9-]{2,24}$')
DATE = re.compile(r'^\d{4}-\d\d-\d\d$')
TEXT = re.compile(r"^[A-Za-z0-9ÅÄÖåäöÉé .,!?'’:+%/-]*$")

RARITIES = ['common', 'rare', 'epic', 'legendary', 'mythic', 'exclusive']
# fair price range per rarity (so a rare skin cannot cost 40 coins and a common one cannot cost a fortune)
BANDS = {'common': (40, 300), 'rare': (100, 600), 'epic': (300, 1000), 'legendary': (800, 3000),
         'mythic': (2000, 10000), 'exclusive': (10000, 20000)}
ACC = ['headband', 'mohawk', 'helmet', 'ninja', 'shades', 'horns', 'orbit', 'crown', 'halo', 'wings', 'hair',
       'quiff', 'spikes', 'cap', 'headphones', 'ponytail', 'pigtails', 'bow', 'diamonds', 'coins']
SKIN_KEYS = {'id', 'name', 'rarity', 'price', 'body', 'accent', 'eye', 'acc', 'c2', 'cape', 'trail', 'metal',
             'sparkle', 'gild', 'gem', 'kind'}
SKIN_COLORS = ['body', 'accent', 'eye', 'c2']

FEELS = ['normal', 'calm', 'gusty', 'icy', 'party']
FX = ['pumpkins', 'candies', 'spider']
BURGERS = ['shiny', 'candy', 'treat', 'strawberry', 'pirate', 'football']
MUSIC = ['spring', 'summer', 'autumn', 'winter', 'halloween', 'candy', 'trick']
CARDS = ['spooky', 'trick', 'candy', 'ocean', 'sunny', 'frost', 'berry', 'pirate', 'pitch']
ICONS = ['pumpkin', 'candy', 'trick', 'star', 'snow', 'sun', 'heart', 'strawberry', 'chest', 'ball']
THEME_COLORS = ['color', 'skyTop', 'skyBot', 'fog', 'ground', 'lane', 'hemiSky', 'hemiGnd', 'dir', 'rim', 'mount',
                'foliage', 'trunk', 'cloud', 'sun', 'pColor']
THEME_NUMS = {'hemiI': (0, 2), 'dirI': (0, 2), 'rimI': (0, 2), 'sunY': (0, 60), 'sunS': (.3, 3), 'pFall': (-2, 5),
              'pSway': (0, 3), 'pSize': (.05, .6), 'pAlpha': (0, 1), 'fogNear': (20, 120), 'fogFar': (100, 400),
              'laneRough': (0, 1), 'foliageScale': (.5, 1.5), 'cold': (0, 1)}
THEME_KEYS = {'id', 'name', 'note', 'short', 'temp', 'extends', 'feel', 'coinBonus', 'effects', 'burgers', 'music'} \
    | set(THEME_COLORS) | set(THEME_NUMS)
CORE_EXTRA = {'w', 'zeta', 'fall', 'wind', 'catchM', 'coin'}
EVENT_KEYS = {'key', 'theme', 'name', 'h', 'len', 'date', 'from', 'to', 'weekdays', 'skip', 'pre', 'sub', 'liveSub',
              'tag', 'card', 'icon'}

errors = []


def err(where, msg):
    errors.append('%s: %s' % (where, msg))


def load(name):
    p = os.path.join(ROOT, 'content', name)
    try:
        with open(p, encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        err(name, 'file is missing')
    except json.JSONDecodeError as e:
        err(name, 'is not valid JSON (line %d, column %d): %s. Usually a missing or extra comma or quote.' % (e.lineno, e.colno, e.msg))
    return None


def is_num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def text(where, v, maxlen, required=True):
    if not isinstance(v, str):
        if required:
            err(where, 'must be text')
        return
    if required and not v.strip():
        err(where, 'must not be empty')
    if len(v) > maxlen:
        err(where, 'is too long (%d characters, max %d)' % (len(v), maxlen))
    if not TEXT.match(v):
        err(where, 'uses a character that is not allowed. Use letters, numbers, spaces and . , ! ? \' : + % / - only')


def color(where, v):
    if not (isinstance(v, str) and HEX.match(v)):
        err(where, 'must be a colour like "#ff8800" (a # and 6 letters/numbers), got %r' % (v,))


def valid_date(where, v):
    if not (isinstance(v, str) and DATE.match(v)):
        err(where, 'must be a date like "2026-12-24"')
        return None
    try:
        return datetime.date.fromisoformat(v)
    except ValueError:
        err(where, '%r is not a real calendar date' % v)
        return None


def check_skins(skins):
    if not isinstance(skins, list):
        err('skins.json', 'must be a list of skins')
        return {}
    if len(skins) > 60:
        err('skins.json', 'has %d skins, the shop holds at most 60' % len(skins))
    seen = {}
    for i, s in enumerate(skins):
        w = 'skins.json #%d' % (i + 1)
        if not isinstance(s, dict):
            err(w, 'must be an object { ... }')
            continue
        sid = s.get('id')
        w = 'skin %r' % (sid,)
        if not (isinstance(sid, str) and ID.match(sid)):
            err(w, 'id must be 2-24 lowercase letters, numbers or dashes')
            continue
        if sid in seen:
            err(w, 'id is used twice')
        seen[sid] = s
        for k in s:
            if k not in SKIN_KEYS:
                err(w, 'has an unknown field "%s". Allowed: %s' % (k, ', '.join(sorted(SKIN_KEYS))))
        text(w + ' name', s.get('name'), 20)
        if s.get('rarity') not in RARITIES:
            err(w, 'rarity must be one of: ' + ', '.join(RARITIES))
        p = s.get('price')
        if sid == 'bun':
            if p != 0:
                err(w, 'the starter skin "bun" must stay free (price 0)')
        elif not (is_num(p) and p == int(p) and 40 <= p <= 20000):
            err(w, 'price must be a whole number from 40 to 20000')
        elif s.get('rarity') in BANDS and not BANDS[s['rarity']][0] <= p <= BANDS[s['rarity']][1]:
            err(w, 'a %s skin must cost between %d and %d coins' % ((s['rarity'],) + BANDS[s['rarity']]))
        if s.get('kind') is not None:
            if sid != 'copsven' or s.get('kind') != 'baby':
                err(w, 'the "kind" field is reserved for the built-in baby skin. Remove it')
        if sid == 'copsven' and s.get('kind') == 'baby':
            continue  # baby skins are built in code; only name/rarity/price are data
        for k in SKIN_COLORS:
            if k not in s:
                err(w, 'needs a "%s" colour' % k)
            else:
                color('%s %s' % (w, k), s[k])
        if 'cape' in s:
            color(w + ' cape', s['cape'])
        if 'acc' not in s or not isinstance(s['acc'], str):
            err(w, '"acc" must be text like "crown+wings" (parts joined by +)')
        else:
            parts = s['acc'].split('+')
            for a in parts:
                if a not in ACC:
                    err(w, 'unknown part "%s". Parts you can use: %s' % (a, ', '.join(ACC)))
            if len(parts) > 4:
                err(w, 'use at most 4 parts')
        if 'trail' in s:
            if not isinstance(s['trail'], list) or not 1 <= len(s['trail']) <= 3:
                err(w, '"trail" must be a list of 1 to 3 colours')
            else:
                for j, c in enumerate(s['trail']):
                    color('%s trail #%d' % (w, j + 1), c)
        if 'metal' in s and not (is_num(s['metal']) and 0 <= s['metal'] <= 1):
            err(w, '"metal" must be a number from 0 to 1')
        for b in ('sparkle', 'gild', 'gem'):
            if b in s and not isinstance(s[b], bool):
                err(w, '"%s" must be true or false' % b)
    if 'bun' not in seen:
        err('skins.json', 'the starter skin with id "bun" must stay in the file')
    elif skins and skins[0].get('id') != 'bun':
        err('skins.json', 'the "bun" skin must stay first in the list')
    return seen


def theme_fields(w, t, core):
    for k in t:
        if k not in THEME_KEYS and not (core and k in CORE_EXTRA):
            err(w, 'has an unknown field "%s"' % k)
    text(w + ' name', t.get('name'), 24)
    text(w + ' note', t.get('note'), 120)
    if 'short' in t:
        text(w + ' short', t['short'], 12)
    if not (is_num(t.get('temp')) and -30 <= t['temp'] <= 40):
        err(w, '"temp" (the temperature shown) must be a number from -30 to 40')
    for k in THEME_COLORS:
        if k in t:
            color('%s %s' % (w, k), t[k])
    for k, (a, b) in THEME_NUMS.items():
        if k in t and not (is_num(t[k]) and a <= t[k] <= b):
            err(w, '"%s" must be a number from %s to %s' % (k, a, b))
    if not core:
        if 'feel' in t and t['feel'] not in FEELS:
            err(w, '"feel" must be one of: ' + ', '.join(FEELS))
        if 'coinBonus' in t and t['coinBonus'] not in (1, 1.5, 2):
            err(w, '"coinBonus" must be 1, 1.5 or 2')
        if 'effects' in t:
            if not isinstance(t['effects'], list) or any(e not in FX for e in t['effects']):
                err(w, '"effects" must be a list using only: ' + ', '.join(FX))
        if 'burgers' in t and t['burgers'] not in BURGERS:
            err(w, '"burgers" must be one of: ' + ', '.join(BURGERS))
        if 'music' in t and t['music'] not in MUSIC:
            err(w, '"music" must be one of: ' + ', '.join(MUSIC))
    else:
        mech = {'w': (4, 30), 'zeta': (.2, 1.5), 'fall': (.5, 1.5), 'wind': (0, 2.5), 'catchM': (.7, 1.3), 'coin': (.5, 2)}
        for k, (a, b) in mech.items():
            if not (is_num(t.get(k)) and a <= t[k] <= b):
                err(w, '"%s" must be a number from %s to %s' % (k, a, b))
        for k in THEME_COLORS:
            if k not in t:
                err(w, 'needs "%s"' % k)
        for k in THEME_NUMS:
            if k not in t:
                err(w, 'needs "%s"' % k)


def check_themes(data):
    if not isinstance(data, dict) or not isinstance(data.get('seasons'), list) or not isinstance(data.get('themes'), list):
        err('themes.json', 'must look like { "seasons": [...4...], "themes": [...] }')
        return {}
    ids = {}
    core = ['spring', 'summer', 'autumn', 'winter']
    if len(data['seasons']) != 4:
        err('themes.json', '"seasons" must have exactly 4 entries (spring, summer, autumn, winter)')
    for i, s in enumerate(data['seasons'][:4]):
        w = 'season %d' % (i + 1)
        if not isinstance(s, dict) or s.get('id') != core[i]:
            err(w, 'must have id "%s"' % core[i])
            continue
        ids[s['id']] = s
        theme_fields('season "%s"' % s['id'], s, True)
    if len(data['themes']) > 40:
        err('themes.json', 'has too many themes (max 40)')
    for i, t in enumerate(data['themes']):
        if not isinstance(t, dict):
            err('themes.json theme #%d' % (i + 1), 'must be an object { ... }')
            continue
        tid = t.get('id')
        w = 'theme %r' % (tid,)
        if not (isinstance(tid, str) and ID.match(tid)):
            err(w, 'id must be 2-24 lowercase letters, numbers or dashes')
            continue
        if tid in ids:
            err(w, 'id is used twice')
        base = t.get('extends')
        if base is not None and base not in ids:
            err(w, '"extends" must name an earlier theme or season (%s)' % ', '.join(ids))
        ids[tid] = t
        theme_fields(w, t, False)
        if base is None:
            for k in THEME_COLORS + list(THEME_NUMS):
                if k not in t:
                    err(w, 'needs "%s" (or add "extends": "summer" to copy the rest from another theme)' % k)
    return ids


def check_events(events, themes):
    if not isinstance(events, list):
        err('events.json', 'must be a list of events')
        return
    if len(events) > 30:
        err('events.json', 'has too many events (max 30)')
    seen = set()
    parsed = []
    for i, e in enumerate(events):
        w = 'events.json #%d' % (i + 1)
        if not isinstance(e, dict):
            err(w, 'must be an object { ... }')
            continue
        key = e.get('key')
        w = 'event %r' % (key,)
        if not (isinstance(key, str) and ID.match(key)):
            err(w, 'key must be 2-24 lowercase letters, numbers or dashes')
            continue
        if key in seen:
            err(w, 'key is used twice')
        seen.add(key)
        for k in e:
            if k not in EVENT_KEYS:
                err(w, 'has an unknown field "%s"' % k)
        th = e.get('theme')
        if th not in themes or th in ('spring', 'summer', 'autumn', 'winter'):
            err(w, '"theme" must be the id of a theme in themes.json (not a season)')
        text(w + ' name', e.get('name'), 24)
        text(w + ' sub', e.get('sub'), 80)
        text(w + ' liveSub', e.get('liveSub'), 80)
        if 'tag' in e:
            text(w + ' tag', e['tag'], 20)
        if e.get('card') not in CARDS:
            err(w, '"card" must be one of: ' + ', '.join(CARDS))
        if e.get('icon') not in ICONS:
            err(w, '"icon" must be one of: ' + ', '.join(ICONS))
        h, ln = e.get('h'), e.get('len')
        okh = isinstance(h, int) and not isinstance(h, bool) and 0 <= h <= 23
        okl = isinstance(ln, int) and not isinstance(ln, bool) and 1 <= ln <= 3
        if not okh:
            err(w, '"h" (start hour) must be a whole number from 0 to 23')
        if not okl:
            err(w, '"len" (hours it lasts) must be 1, 2 or 3')
        if okh and okl and h + ln > 24:
            err(w, 'must end before midnight (h + len is at most 24)')
        if 'pre' in e and not (isinstance(e['pre'], int) and not isinstance(e['pre'], bool) and 0 <= e['pre'] <= (h if okh else 23)):
            err(w, '"pre" (hour the start-screen card appears) must be a whole number from 0 up to the start hour')
        d = {}
        for k in ('date', 'from', 'to'):
            if k in e:
                d[k] = valid_date('%s %s' % (w, k), e[k])
        if 'date' in e and ('from' in e or 'to' in e):
            err(w, 'use either "date" or "from"/"to", not both')
        if d.get('from') and d.get('to') and d['from'] > d['to']:
            err(w, '"from" must not be after "to"')
        if 'weekdays' in e and (not isinstance(e['weekdays'], list) or not e['weekdays'] or
                                any(not (isinstance(x, int) and not isinstance(x, bool) and 0 <= x <= 6) for x in e['weekdays'])):
            err(w, '"weekdays" must be a list of numbers 0-6 (0 = Sunday)')
        if 'skip' in e:
            if not isinstance(e['skip'], list):
                err(w, '"skip" must be a list of dates')
            else:
                for j, x in enumerate(e['skip']):
                    valid_date('%s skip #%d' % (w, j + 1), x)
        if okh and okl:
            parsed.append((key, e, h, h + ln))
    # two events must not run at the same time
    for a in range(len(parsed)):
        for b in range(a + 1, len(parsed)):
            ka, ea, sa, ta = parsed[a]
            kb, eb, sb, tb = parsed[b]
            if sa < tb and sb < ta and days_overlap(ea, eb):
                err('events', '"%s" and "%s" run at the same time. Move one to another hour or day' % (ka, kb))


def days_overlap(a, b):
    """Could these two events fall on the same calendar day? (conservative)"""
    def rng(e):
        if e.get('date') and DATE.match(str(e['date'])):
            return e['date'], e['date']
        return e.get('from') or '0000-00-00', e.get('to') or '9999-99-99'
    la, ha = rng(a)
    lb, hb = rng(b)
    if not (la <= hb and lb <= ha):
        return False
    wa, wb = a.get('weekdays'), b.get('weekdays')
    if wa and wb and not set(wa) & set(wb):
        return False
    # an explicit skip list can remove the clash on a single day
    for x, y in ((a, b), (b, a)):
        if y.get('date') and y['date'] in (x.get('skip') or []):
            return False
    return True


def git_json(ref, name):
    try:
        out = subprocess.run(['git', 'show', '%s:content/%s' % (ref, name)], cwd=ROOT, capture_output=True, text=True, check=True)
        return json.loads(out.stdout)
    except Exception:
        return None


def check_against(ref, skins, events, themes):
    """Everything that already exists in REF must be unchanged: a branch may only ADD."""
    old = git_json(ref, 'skins.json')
    if old is not None and isinstance(skins, list):
        now = {s.get('id'): s for s in skins if isinstance(s, dict)}
        for s in old:
            if s['id'] not in now:
                err('skin %r' % s['id'], 'was removed. New work may only add skins')
            elif now[s['id']] != s:
                err('skin %r' % s['id'], 'was changed. Existing skins can only be changed by a grown-up')
        for sid, s in now.items():
            if sid not in {o['id'] for o in old} and s.get('rarity') == 'exclusive':
                err('skin %r' % sid, 'Premium (exclusive) skins are for grown-ups to add. Pick legendary or lower')
    old = git_json(ref, 'events.json')
    if old is not None and isinstance(events, list):
        now = {e.get('key'): e for e in events if isinstance(e, dict)}
        for e in old:
            if e['key'] not in now:
                err('event %r' % e['key'], 'was removed. New work may only add events')
            elif now[e['key']] != e:
                err('event %r' % e['key'], 'was changed. Existing events can only be changed by a grown-up')
    old = git_json(ref, 'themes.json')
    if old is not None and isinstance(themes, dict):
        if themes.get('seasons') != old.get('seasons'):
            err('themes.json', 'the four seasons were changed. Only a grown-up may do that')
        now = {t.get('id'): t for t in themes.get('themes', []) if isinstance(t, dict)}
        for t in old.get('themes', []):
            if t['id'] not in now:
                err('theme %r' % t['id'], 'was removed. New work may only add themes')
            elif now[t['id']] != t:
                err('theme %r' % t['id'], 'was changed. Existing themes can only be changed by a grown-up')


def main():
    ref = None
    if '--against' in sys.argv:
        ref = sys.argv[sys.argv.index('--against') + 1]
    skins, events, themes = load('skins.json'), load('events.json'), load('themes.json')
    if skins is not None:
        check_skins(skins)
    ids = check_themes(themes) if themes is not None else {}
    if events is not None:
        check_events(events, ids)
    if ref:
        check_against(ref, skins, events, themes)
    if errors:
        print('Content check FAILED (%d problem%s):' % (len(errors), '' if len(errors) == 1 else 's'))
        for e in errors:
            print('  - ' + e)
        sys.exit(1)
    print('Content check OK: %d skins, %d themes, %d events' % (len(skins), len(themes['themes']), len(events)))


if __name__ == '__main__':
    main()
