#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(service_workers="block", viewport={"width": 430, "height": 900})
    pg = ctx.new_page()
    pg.goto("http://localhost:8080/tools.html", wait_until="networkidle")
    el = pg.query_selector("#rem-toggle")
    el.scroll_into_view_if_needed()
    pg.wait_for_timeout(400)
    panel = pg.query_selector("#rem-toggle")
    box = panel.bounding_box()
    pg.screenshot(path="/tmp/reminder.png", clip={"x":0,"y":max(0,box["y"]-220),"width":430,"height":420})
    b.close()
print("done")
