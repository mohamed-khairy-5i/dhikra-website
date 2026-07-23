#!/usr/bin/env python3
"""Wire sharecard.js (G6) into the 15 adhkar topic pages.
Insert after recite.js and before focus.js so window.dhikraShareCard exists
when Focus Mode builds its overlay. Idempotent.
"""
PAGES = [
    "adhkar-food", "adhkar-healing", "adhkar-home", "adhkar-istighfar",
    "adhkar-istikhara", "adhkar-masaa", "adhkar-mosque", "adhkar-nawm",
    "adhkar-sabah", "adhkar-salah", "adhkar-travel", "adhkar-wakeup",
    "adhkar-weather", "adhkar-work", "adhkar-wudu",
]
SHARE = '<script src="assets/js/sharecard.js" defer></script>\n'
RECITE = '<script src="assets/js/recite.js" defer></script>\n'

n = 0
for name in PAGES:
    path = f"{name}.html"
    with open(path, encoding="utf-8") as f:
        html = f.read()
    if "sharecard.js" in html:
        print(f"skip: {path}"); continue
    if RECITE not in html:
        print(f"WARN no recite.js tag: {path}"); continue
    html = html.replace(RECITE, RECITE + SHARE, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    n += 1
    print(f"wired: {path}")
print(f"\nDone. {n} pages.")
