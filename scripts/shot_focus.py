#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(service_workers="block", viewport={"width": 430, "height": 860})
    pg = ctx.new_page()
    pg.goto("http://localhost:8080/adhkar-sabah.html", wait_until="networkidle")
    pg.click("[data-focus-start]")
    pg.wait_for_timeout(500)
    pg.click("[data-focus-tap]")
    pg.wait_for_timeout(300)
    pg.screenshot(path="/tmp/focus_light.png")
    # dark mode
    pg.evaluate("() => { document.body.classList.add('dark-mode'); }")
    pg.wait_for_timeout(300)
    pg.screenshot(path="/tmp/focus_dark.png")
    b.close()
print("shots saved")
