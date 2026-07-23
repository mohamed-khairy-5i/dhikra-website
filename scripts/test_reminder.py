#!/usr/bin/env python3
import sys
from playwright.sync_api import sync_playwright

URL = "http://localhost:8080/tools.html"
errors = []
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(service_workers="block", permissions=["notifications"])
    pg = ctx.new_page()
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_timeout(400)

    print("Notification API:", pg.evaluate("() => 'Notification' in window"))
    print("panel present:", bool(pg.query_selector("#rem-toggle")))
    print("initial status:", (pg.text_content("#rem-status") or "").strip()[:60])

    # set time then enable
    pg.fill("#rem-time", "06:30")
    pg.click("#rem-toggle")
    pg.wait_for_timeout(300)
    print("aria-pressed after enable:", pg.get_attribute("#rem-toggle", "aria-pressed"))
    print("status after enable:", (pg.text_content("#rem-status") or "").strip()[:70])
    cfg = pg.evaluate("() => localStorage.getItem('reminder')")
    print("localStorage reminder:", cfg)

    # force notify path by setting firedOn empty and time = now, then call check via internal interval
    fired = pg.evaluate("""() => {
        // simulate: set reminder time to current minute and clear firedOn
        const now = new Date();
        const hh = String(now.getHours()).padStart(2,'0');
        const mm = String(now.getMinutes()).padStart(2,'0');
        const cfg = JSON.parse(localStorage.getItem('reminder'));
        cfg.time = hh+':'+mm; cfg.firedOn=''; localStorage.setItem('reminder', JSON.stringify(cfg));
        return cfg.time;
    }""")
    print("set reminder to now:", fired)
    # change input to same value to trigger check()
    pg.fill("#rem-time", fired)
    pg.dispatch_event("#rem-time", "change")
    pg.wait_for_timeout(500)
    after = pg.evaluate("() => JSON.parse(localStorage.getItem('reminder')).firedOn")
    print("firedOn after trigger (should be today's date):", after)

    # disable
    pg.click("#rem-toggle")
    pg.wait_for_timeout(200)
    print("aria-pressed after disable:", pg.get_attribute("#rem-toggle", "aria-pressed"))

    b.close()
print("\nCONSOLE ERRORS:", [e for e in errors if 'Transition' not in e] or "NONE")
sys.exit(1 if [e for e in errors if 'Transition' not in e] else 0)
