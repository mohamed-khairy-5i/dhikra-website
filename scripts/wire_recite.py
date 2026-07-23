#!/usr/bin/env python3
"""Wire recite.js (G1) into the 15 adhkar topic pages.
Insert <script src="assets/js/recite.js" defer></script> right AFTER app.js
and BEFORE focus.js (so window.dhikraRecite is defined for Focus Mode).
Idempotent.
"""
PAGES = [
    "adhkar-food", "adhkar-healing", "adhkar-home", "adhkar-istighfar",
    "adhkar-istikhara", "adhkar-masaa", "adhkar-mosque", "adhkar-nawm",
    "adhkar-sabah", "adhkar-salah", "adhkar-travel", "adhkar-wakeup",
    "adhkar-weather", "adhkar-work", "adhkar-wudu",
]
RECITE = '<script src="assets/js/recite.js" defer></script>\n'
APP = '<script src="assets/js/app.js"></script>\n'

n = 0
for name in PAGES:
    path = f"{name}.html"
    with open(path, encoding="utf-8") as f:
        html = f.read()
    if "recite.js" in html:
        print(f"skip: {path}")
        continue
    if APP not in html:
        print(f"WARN no app.js tag: {path}")
        continue
    html = html.replace(APP, APP + RECITE, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    n += 1
    print(f"wired: {path}")
print(f"\nDone. {n} pages.")
