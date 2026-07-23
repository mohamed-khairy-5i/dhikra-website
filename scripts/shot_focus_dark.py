#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(service_workers="block", viewport={"width": 430, "height": 860})
    pg = ctx.new_page()
    pg.goto("http://localhost:8080/adhkar-sabah.html", wait_until="networkidle")
    # enable dark BEFORE opening focus so no transition collision
    pg.evaluate("() => { document.body.classList.add('dark-mode'); localStorage.setItem('theme', '\"dark\"'); }")
    pg.wait_for_timeout(300)
    pg.click("[data-focus-start]")
    pg.wait_for_timeout(700)
    bg = pg.evaluate("() => getComputedStyle(document.querySelector('.focus-overlay')).backgroundColor")
    print("overlay bg:", bg)
    pg.screenshot(path="/tmp/focus_dark2.png")
    b.close()
print("done")
