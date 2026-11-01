#!/usr/bin/env python3
"""Builds index.html from src/ + content/. Run: python3 tools/build.py
The game stays one self-contained file (works offline as a Home Screen app)."""
import json, os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
r = subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'validate_content.py')] + sys.argv[1:])
if r.returncode:
    sys.exit('Build stopped: fix the content problems above first.')
def rd(p):
    with open(os.path.join(ROOT, p), encoding='utf-8') as f:
        return f.read()
manifest = json.loads(rd('src/manifest.json'))
js = ''.join(rd('src/' + f) for f in manifest)
def inline(name):
    # re-serialise so the file is embedded as plain data, and '</' can never close the script tag
    return json.dumps(json.loads(rd('content/%s.json' % name)), ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
for name in ('skins', 'events', 'themes'):
    tag = '/*@@%s@@*/' % name + {'skins': '[]', 'events': '[]', 'themes': '{seasons:[],themes:[]}'}[name]
    assert js.count(tag) == 1, tag
    js = js.replace(tag, inline(name))
html = rd('src/ui/shell.html')
assert html.count('/*@@GAME@@*/') == 1
html = html.replace('/*@@GAME@@*/', js.rstrip('\n'))
with open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(html)
# the offline cache name follows the page content, so a changed game always replaces the old cached copy
import hashlib, re
sw = rd('sw.js')
ver = 'lo-burgers-' + hashlib.sha1(html.encode('utf-8')).hexdigest()[:8]
sw2 = re.sub(r"var VERSION='[^']*';", "var VERSION='%s';" % ver, sw, count=1)
with open(os.path.join(ROOT, 'sw.js'), 'w', encoding='utf-8') as f:
    f.write(sw2)
print('Built index.html (%d KB), cache %s' % (len(html) // 1024, ver))
