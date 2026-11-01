#!/usr/bin/env python3
"""Regression tests: the rules must keep rejecting things that could change how the game plays."""
import copy, json, os, shutil, subprocess, sys, tempfile
SRC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tmp = tempfile.mkdtemp()
shutil.copytree(os.path.join(SRC, 'content'), os.path.join(tmp, 'content'))
shutil.copytree(os.path.join(SRC, 'tools'), os.path.join(tmp, 'tools'), ignore=shutil.ignore_patterns('__pycache__'))
base = {n: json.load(open(os.path.join(tmp, 'content', n + '.json'))) for n in ('skins', 'events', 'themes')}
fails = []
SK = lambda **k: dict({"id": "t1", "name": "T", "rarity": "rare", "price": 300, "body": "#112233", "accent": "#112233", "eye": "#112233", "acc": "crown", "c2": "#112233"}, **k)
TH = lambda **k: dict({"id": "x1", "extends": "summer", "name": "X", "note": "n", "temp": 5}, **k)
EV = lambda **k: dict({"key": "e1", "theme": "candy", "name": "E", "h": 10, "len": 1, "sub": "s", "liveSub": "s", "card": "candy", "icon": "star"}, **k)


def trial(label, mut, ok=False):
    d = copy.deepcopy(base)
    mut(d)
    for n in d:
        json.dump(d[n], open(os.path.join(tmp, 'content', n + '.json'), 'w'))
    r = subprocess.run([sys.executable, os.path.join(tmp, 'tools', 'validate_content.py')], capture_output=True, text=True)
    passed = (r.returncode == 0) == ok
    print(('ok   ' if passed else 'FAIL ') + label)
    if not passed:
        fails.append(label)


skins = lambda d, s: d['skins'].append(s)
themes = lambda d, t: d['themes']['themes'].append(t)
events = lambda d, e: d['events'].append(e)
trial('a normal new skin is accepted', lambda d: skins(d, SK()), ok=True)
trial('a normal new event is accepted', lambda d: events(d, EV()), ok=True)
trial('a normal new theme is accepted', lambda d: themes(d, TH(feel='calm', coinBonus=1.5)), ok=True)
trial('free skin', lambda d: skins(d, SK(price=0)))
trial('huge price', lambda d: skins(d, SK(price=10 ** 9)))
trial('cheap legendary', lambda d: skins(d, SK(rarity='legendary', price=100)))
trial('markup in a name', lambda d: skins(d, SK(name='<b>x')))
trial('unknown skin field', lambda d: skins(d, SK(speed=9)))
trial('colour name instead of hex', lambda d: skins(d, SK(body='red')))
trial('part that does not exist', lambda d: skins(d, SK(acc='rocket')))
trial('baby kind', lambda d: skins(d, SK(kind='baby')))
trial('duplicate skin id', lambda d: skins(d, SK(id='pickle')))
trial('theme with raw fall speed', lambda d: themes(d, TH(fall=.1)))
trial('theme with raw wind', lambda d: themes(d, TH(wind=0)))
trial('coin bonus 100', lambda d: themes(d, TH(coinBonus=100)))
trial('unknown feel', lambda d: themes(d, TH(feel='zoom')))
trial('extends a theme that does not exist', lambda d: themes(d, TH(extends='nope')))
trial('event at the same time as another', lambda d: events(d, EV(h=19)))
trial('event lasting all night', lambda d: events(d, EV(h=1, len=12)))
trial('event with unknown theme', lambda d: events(d, EV(theme='nope')))
trial('event using a season as its theme', lambda d: events(d, EV(theme='winter')))
trial('event with unknown field', lambda d: events(d, EV(bonus=5)))
trial('season setting out of range', lambda d: d['themes']['seasons'][0].__setitem__('w', 99))
trial('bun removed', lambda d: d['skins'].pop(0))
shutil.rmtree(tmp)
if fails:
    sys.exit('%d test(s) failed' % len(fails))
print('all rule tests passed')
