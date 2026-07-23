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
    pg.wait_for_timeout(400)

    has_api = pg.evaluate("() => 'speechSynthesis' in window")
    print("speechSynthesis in window:", has_api)
    btns = pg.query_selector_all("[data-recite]")
    print("recite buttons injected:", len(btns))
    print("dhikraRecite global:", pg.evaluate("() => !!window.dhikraRecite"))

    if btns:
        b0 = btns[0]
        print("initial aria-pressed:", b0.get_attribute("aria-pressed"))
        b0.click()
        pg.wait_for_timeout(200)
        print("after click aria-pressed:", b0.get_attribute("aria-pressed"))
        b0.click()  # toggle stop
        pg.wait_for_timeout(200)
        print("after 2nd click aria-pressed:", b0.get_attribute("aria-pressed"))

    # focus overlay listen button visibility
    pg.click("[data-focus-start]")
    pg.wait_for_timeout(400)
    fl = pg.query_selector("[data-focus-listen]")
    print("focus-listen present:", bool(fl), "hidden:", fl.get_attribute("hidden") if fl else "n/a")

    b.close()
print("\nCONSOLE ERRORS:", [e for e in errors if 'Transition was skipped' not in e] or "NONE (ignoring benign transition notices)")
sys.exit(0)
