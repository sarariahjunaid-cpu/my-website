#!/usr/bin/env python3
"""Rebuilds mizan/js/i18n.js DATA from the translation tables in this folder.
Each line of translations-*.txt:  English || Nederlands || العربية   (later lines override earlier ones).
Usage: python3 mizan/i18n/build.py
"""
import json, re, pathlib
here = pathlib.Path(__file__).parent
nl, ar = {}, {}
for f in sorted(here.glob("translations-*.txt")):
    for line in f.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        parts = [p.strip() for p in line.split(" || ")]
        if len(parts) != 3:
            raise SystemExit("bad line in %s: %r" % (f.name, line[:80]))
        nl[parts[0]], ar[parts[0]] = parts[1], parts[2]
js = (here.parent / "js" / "i18n.js")
src = js.read_text(encoding="utf-8")
data = json.dumps({"nl": nl, "ar": ar}, ensure_ascii=False)
new = re.sub(r"var DATA = \{.*?\};\n  var LANGS", lambda m: "var DATA = " + data + ";\n  var LANGS", src, count=1, flags=re.S)
if new == src and data not in src:
    raise SystemExit("could not find DATA block")
js.write_text(new, encoding="utf-8")
print(len(nl), "strings written")
