#!/usr/bin/env python3
import sys, base64
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
    pg.wait_for_timeout(600)

    print("dhikraShareCard global:", pg.evaluate("() => !!window.dhikraShareCard"))
    btns = pg.query_selector_all("[data-sharecard]")
    print("sharecard buttons injected:", len(btns))

    # Directly exercise the canvas renderer and get a data URL back to validate output
    data_url = pg.evaluate("""async () => {
        // Reproduce the module's draw by calling generate is hard (it shares/downloads),
        // so we test the canvas pipeline the same way: build canvas, ensure fonts, draw text.
        await (document.fonts && document.fonts.ready);
        const c = document.createElement('canvas'); c.width=1080; c.height=1080;
        const ctx = c.getContext('2d');
        // minimal draw sanity
        const g = ctx.createLinearGradient(0,0,1080,1080);
        g.addColorStop(0,'#0f2a22'); g.addColorStop(1,'#123b30');
        ctx.fillStyle=g; ctx.fillRect(0,0,1080,1080);
        ctx.fillStyle='#f4efe4'; ctx.textAlign='center';
        ctx.font='400 62px Amiri, serif';
        ctx.fillText('اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ', 540, 540);
        return c.toDataURL('image/png');
    }""")
    print("canvas dataURL length:", len(data_url), "starts:", data_url[:30])

    # Now actually trigger the real generate() (headless: no navigator.share -> download path).
    # Intercept download.
    got = {}
    def on_dl(d):
        got['name'] = d.suggested_filename
    pg.on("download", on_dl)
    if btns:
        btns[0].click()
        pg.wait_for_timeout(1500)
    print("download triggered filename:", got.get('name'))

    # save the sanity canvas to a file for visual check
    if data_url.startswith("data:image/png;base64,"):
        with open("/tmp/sharecard_sanity.png","wb") as f:
            f.write(base64.b64decode(data_url.split(",",1)[1]))
        print("saved /tmp/sharecard_sanity.png")

    b.close()
print("\nCONSOLE ERRORS:", [e for e in errors if 'Transition' not in e] or "NONE")
sys.exit(1 if [e for e in errors if 'Transition' not in e] else 0)
