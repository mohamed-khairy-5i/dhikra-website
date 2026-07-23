#!/usr/bin/env python3
"""Wire Focus Mode (G4) into the 15 adhkar topic pages.
- Insert a focus-start button as the FIRST child of .toolbar-actions
- Insert focus.js script tag right after the app.js script tag
Idempotent: skips a page if data-focus-start already present.
"""
import re, sys

PAGES = [
    "adhkar-food", "adhkar-healing", "adhkar-home", "adhkar-istighfar",
    "adhkar-istikhara", "adhkar-masaa", "adhkar-mosque", "adhkar-nawm",
    "adhkar-sabah", "adhkar-salah", "adhkar-travel", "adhkar-wakeup",
    "adhkar-weather", "adhkar-work", "adhkar-wudu",
]

FOCUS_BTN = (
    '\n        <button class="tool-chip focus-start" data-focus-start>'
    '<i class="fas fa-circle-play"></i>'
    '<span class="lang-ar">وضع التركيز</span>'
    '<span class="lang-en">Focus</span></button>'
)

SCRIPT_TAG = '<script src="assets/js/focus.js" defer></script>\n'

changed = 0
for name in PAGES:
    path = f"{name}.html"
    with open(path, encoding="utf-8") as f:
        html = f.read()
    if "data-focus-start" in html:
        print(f"skip (already wired): {path}")
        continue

    # 1) Insert focus button as first child of toolbar-actions
    marker = '<div class="toolbar-actions">'
    if marker not in html:
        print(f"WARN no toolbar-actions: {path}")
        continue
    html = html.replace(marker, marker + FOCUS_BTN, 1)

    # 2) Insert focus.js script after app.js
    app_tag = '<script src="assets/js/app.js"></script>\n'
    if app_tag not in html:
        # tolerate no trailing newline variant
        app_tag2 = '<script src="assets/js/app.js"></script>'
        html = html.replace(app_tag2, app_tag2 + "\n" + SCRIPT_TAG, 1)
    else:
        html = html.replace(app_tag, app_tag + SCRIPT_TAG, 1)

    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    changed += 1
    print(f"wired: {path}")

print(f"\nDone. {changed} pages wired.")
