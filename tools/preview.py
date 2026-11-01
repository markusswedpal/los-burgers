#!/usr/bin/env python3
"""Draws a preview of a NEW skin, theme or event before anything is saved.

  python3 tools/preview.py draft.json

draft.json may hold any of:  {"skin": {...}, "theme": {...}, "event": {...}}
It checks the draft with the same rules as the game, then writes preview/preview.html
(open it in a browser). Nothing in content/ is changed.
"""
import copy, html, json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import validate_content as V

E = html.escape


def rd(p):
    with open(os.path.join(ROOT, p), encoding='utf-8') as f:
        return f.read()


def content():
    return (json.loads(rd('content/skins.json')), json.loads(rd('content/events.json')), json.loads(rd('content/themes.json')))


def merged(draft):
    skins, events, themes = content()
    skins, events, themes = copy.deepcopy(skins), copy.deepcopy(events), copy.deepcopy(themes)
    if 'skin' in draft:
        skins.append(draft['skin'])
    if 'theme' in draft:
        themes['themes'].append(draft['theme'])
    if 'event' in draft:
        events.append(draft['event'])
    return skins, events, themes


def resolve_theme(themes, tid):
    allt = {t['id']: t for t in themes['seasons'] + themes['themes']}
    t = allt.get(tid)
    if not t:
        return None
    base = resolve_theme(themes, t['extends']) if t.get('extends') and t['extends'] != tid else {}
    out = dict(base or {})
    out.update(t)
    return out


def skin_svg(s):
    accs = s.get('acc', '').split('+')
    cape = '<rect x="48" y="62" width="104" height="100" rx="10" fill="%s"/>' % s['cape'] if s.get('cape') else ''
    trail = ''.join('<circle cx="%d" cy="%d" r="%d" fill="%s" opacity=".7"/>' % (30 - i * 14, 150 - i * 6, 10 - i * 2, c)
                    for i, c in enumerate(s.get('trail', [])))
    sparkle = '<text x="150" y="50" font-size="26" fill="#fff6a8">✦</text><text x="30" y="70" font-size="18" fill="#fff6a8">✦</text>' if s.get('sparkle') else ''
    ring = '<circle cx="100" cy="110" r="54" fill="none" stroke="%s" stroke-width="5"/>' % s['c2'] if 'orbit' in accs or 'halo' in accs else ''
    return ('<svg viewBox="0 0 200 200" width="200" height="200">%s%s<circle cx="100" cy="110" r="46" fill="%s" stroke="%s" stroke-width="6"/>'
            '<ellipse cx="86" cy="94" rx="14" ry="9" fill="#fff" opacity=".35"/>'
            '<circle cx="84" cy="108" r="9" fill="%s"/><circle cx="116" cy="108" r="9" fill="%s"/>'
            '<circle cx="86" cy="109" r="4" fill="#1a0b33"/><circle cx="118" cy="109" r="4" fill="#1a0b33"/>'
            '<path d="M84 132q16 12 32 0" fill="none" stroke="%s" stroke-width="5" stroke-linecap="round"/>%s%s</svg>'
            ) % (cape, trail, s['body'], s['accent'], s['eye'], s['eye'], s['accent'], ring, sparkle)


def theme_svg(t):
    g = lambda k, d: t.get(k, d)
    dots = ''.join('<circle cx="%d" cy="%d" r="%.1f" fill="%s" opacity=".85"/>' % (20 + (i * 53) % 280, 12 + (i * 37) % 120, 1.5 + (i % 3), g('pColor', '#fff')) for i in range(26))
    trees = ''.join('<rect x="%d" y="148" width="5" height="16" fill="%s"/><circle cx="%d" cy="142" r="13" fill="%s"/>' % (x, g('trunk', '#654'), x + 2, g('foliage', '#3a3')) for x in (26, 70, 236, 280))
    return ('<svg viewBox="0 0 320 200" width="320" height="200"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="%s"/><stop offset="1" stop-color="%s"/></linearGradient></defs>'
            '<rect width="320" height="200" fill="url(#sky)"/><circle cx="240" cy="48" r="20" fill="%s"/>'
            '<path d="M0 130 L50 82 L96 126 L150 76 L210 128 L262 88 L320 132 V160 H0z" fill="%s"/>'
            '<rect y="150" width="320" height="50" fill="%s"/><path d="M110 200 L136 150 H184 L210 200z" fill="%s"/>%s%s</svg>'
            ) % (g('skyTop', '#369'), g('skyBot', '#9cf'), g('sun', '#ff8'), g('mount', '#99a'), g('ground', '#5a5'), g('lane', '#8c8'), trees, dots)


def event_css():
    css = rd('src/ui/shell.html')
    css = css[css.index('<style>') + 7:css.index('</style>')]
    out, depth, cur = [], 0, ''
    for ch in css:
        cur += ch
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                r = cur.strip()
                if re.match(r'(\.evcard|\.evt|\.evpk|\.evic|@keyframes ev)', r):
                    out.append(r)
                cur = ''
    return '\n'.join(out)


def icons():
    s = rd('src/ui/screens.js')
    found = dict((m.group(1).lower(), m.group(2)) for m in re.finditer(r"var EV_(PUMPKIN|CANDY|TRICK)='(.*?)';\n", s))
    for m in re.finditer(r"\n  (star|snow|sun|heart):'(<svg.*?</svg>)'", s):
        found[m.group(1)] = m.group(2)
    return found


def event_cards(e, theme):
    ic = icons().get(e['icon'], '')
    cls = '' if e['card'] == 'spooky' else ' ' + e['card']
    out = []
    for live in (False, True):
        title = e['name'] + (' is live!' if live else '')
        sub = e['liveSub'] if live else e['sub']
        when = 'Ends in %d min' % (e['len'] * 60 - 10) if live else 'Today at %d:00 · starts in 1h 0m' % e['h']
        tag = '<span class="evtag">%s</span>' % E(e['tag']) if e.get('tag') else ''
        out.append('<div class="evcard%s%s"><span class="evic">%s</span><div class="evt">%s<b>%s</b><span>%s</span><em>%s</em></div></div>'
                   % (' live' if live else '', cls, ic, tag, E(title), E(sub), E(when)))
    return out


def when_text(e):
    parts = ['%d:00–%d:00' % (e['h'], e['h'] + e['len'])]
    if e.get('date'):
        parts.append('only on ' + e['date'])
    elif e.get('from') or e.get('to'):
        parts.append('from %s to %s' % (e.get('from', 'now'), e.get('to', 'forever')))
    elif e.get('weekdays'):
        names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        parts.append('on ' + ', '.join(names[d] for d in e['weekdays']))
    else:
        parts.append('every day')
    return ' · '.join(parts)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    draft = json.load(open(sys.argv[1], encoding='utf-8'))
    skins, events, themes = merged(draft)
    V.errors.clear()
    V.check_skins(skins)
    ids = V.check_themes(themes)
    V.check_events(events, ids)
    if V.errors:
        print('The draft has problems (nothing was saved):')
        for m in V.errors:
            print('  - ' + m)
        sys.exit(1)
    body = []
    if 'skin' in draft:
        s = draft['skin']
        rar = {'common': '#9fb4d9', 'rare': '#3fb0ff', 'epic': '#c45cff', 'legendary': '#ffb52e', 'mythic': '#ff4f8b'}.get(s['rarity'], '#ffd23f')
        sw = ''.join('<i style="background:%s" title="%s"></i>' % (s[k], k) for k in V.SKIN_COLORS)
        body.append('<section><h2>New skin</h2><div class="row">%s<div><h3>%s</h3><p><b style="color:%s">%s</b> · %d coins</p><p class="sw">%s</p><p>Parts: %s</p></div></div>'
                    '<p class="hint">This is a flat drawing so you can check the colours. In the game the hero is a shiny 3D ball with these parts on it.</p></section>'
                    % (skin_svg(s), E(s['name']), rar, s['rarity'].title(), s['price'], sw, E(s['acc'].replace('+', ', ') or 'none')))
    if 'theme' in draft:
        t = resolve_theme(themes, draft['theme']['id'])
        body.append('<section><h2>New look: %s</h2><div class="row">%s<div><p>%s</p><p>%d°C · feels <b>%s</b> · coins x%s · burgers <b>%s</b> · extras: %s</p></div></div></section>'
                    % (E(t['name']), theme_svg(t), E(t.get('note', '')), t.get('temp', 10), E(t.get('feel', 'normal')), t.get('coinBonus', 1),
                       E(t.get('burgers', 'shiny')), E(', '.join(t.get('effects', [])) or 'none')))
    if 'event' in draft:
        e = draft['event']
        t = resolve_theme(themes, e['theme'])
        cards = event_cards(e, t)
        body.append('<section><h2>New event: %s</h2><p>%s</p><div class="row">%s</div><div class="cards"><div><h4>Before it starts</h4>%s</div><div><h4>While it is on</h4>%s</div></div></section>'
                    % (E(e['name']), E(when_text(e)), theme_svg(t), cards[0], cards[1]))
    page = ('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preview</title><style>'
            ':root{--f-display:"Lilita One","Arial Black",Impact,sans-serif;--hot:#ff4f8b}'
            'body{font:16px/1.4 system-ui,sans-serif;background:#150b33;color:#fff;margin:0;padding:20px;max-width:760px;margin:auto}'
            'section{background:#241450;border-radius:16px;padding:18px;margin:0 0 18px}h2{margin:0 0 10px;font-family:var(--f-display);font-weight:400}'
            '.row{display:flex;gap:18px;align-items:center;flex-wrap:wrap}.sw i{display:inline-block;width:34px;height:34px;border-radius:50%%;margin-right:6px;border:2px solid #fff3}'
            '.hint{opacity:.7;font-size:.85rem}.cards{display:grid;gap:14px;max-width:360px;margin-top:14px}h4{margin:0 0 6px;opacity:.7;font-weight:500}'
            '.evcard{animation:none!important}%s</style>%s' % (event_css(), ''.join(body)))
    os.makedirs(os.path.join(ROOT, 'preview'), exist_ok=True)
    out = os.path.join(ROOT, 'preview', 'preview.html')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(page)
    print('Draft is valid. Preview written to ' + out)


if __name__ == '__main__':
    main()
