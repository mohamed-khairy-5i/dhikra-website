#!/usr/bin/env python3
import sys
from playwright.sync_api import sync_playwright

URL = "http://localhost:8080/adhkar-sabah.html"
errors = []

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(service_workers="block")
    pg = ctx.new_page()
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(URL, wait_until="networkidle")

    # focus button present & visible?
    btn = pg.query_selector("[data-focus-start]")
    print("focus-start present:", bool(btn), "visible:", btn.is_visible() if btn else False)

    # open
    btn.click()
    pg.wait_for_timeout(400)
    ov = pg.query_selector(".focus-overlay")
    print("overlay hidden after open:", ov.get_attribute("hidden"))
    print("step text:", pg.text_content("[data-focus-step]"))
    print("title:", (pg.text_content("[data-focus-title]") or "")[:40])
    print("count:", pg.text_content("[data-focus-count]"))

    # tap 3 times
    for _ in range(3):
        pg.click("[data-focus-tap]")
        pg.wait_for_timeout(60)
    print("count after 3 taps:", pg.text_content("[data-focus-count]"))

    # next
    pg.click("[data-focus-next]")
    pg.wait_for_timeout(400)
    print("step after next:", pg.text_content("[data-focus-step]"))

    # close via Escape
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(200)
    ov = pg.query_selector(".focus-overlay")
    print("overlay hidden after Escape:", ov.get_attribute("hidden"))

    # verify progress synced to localStorage
    prog = pg.evaluate("() => localStorage.getItem('progress:adhkar-sabah.html')")
    print("progress localStorage:", prog)

    b.close()

print("\nCONSOLE ERRORS:", errors if errors else "NONE")
sys.exit(1 if errors else 0)
