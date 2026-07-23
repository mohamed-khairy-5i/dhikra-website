#!/usr/bin/env python3
import base64
from playwright.sync_api import sync_playwright

URL = "http://localhost:8080/adhkar-sabah.html"
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(service_workers="block")
    pg = ctx.new_page()
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_timeout(600)
    # Temporarily override downloadBlob/share by reading the module's draw via a fresh canvas
    # We reproduce the real pipeline by calling the internal draw through generate but capturing blob.
    data_url = pg.evaluate("""async () => {
        await (document.fonts && document.fonts.ready);
        // Rebuild using the SAME palette/draw logic by pulling text from a real card
        const card = document.querySelector('.dhikr-card');
        const title = card.querySelector('.dhikr-title .lang-ar').textContent;
        const text = card.querySelector('.dhikr-text-ar').textContent;
        // Monkey: temporarily replace URL.createObjectURL to grab blob as dataURL
        return await new Promise((resolve) => {
            const origCreate = URL.createObjectURL;
            URL.createObjectURL = function(blob){
                const fr = new FileReader();
                fr.onload = () => { URL.createObjectURL = origCreate; resolve(fr.result); };
                fr.readAsDataURL(blob);
                return 'blob:capture';
            };
            // force download path: temporarily disable native share
            const cs = navigator.canShare; navigator.canShare = undefined;
            window.dhikraShareCard.generate(title, text);
            setTimeout(()=>{ navigator.canShare = cs; }, 100);
        });
    }""")
    if data_url and data_url.startswith("data:image/png;base64,"):
        with open("/tmp/sharecard_real.png","wb") as f:
            f.write(base64.b64decode(data_url.split(",",1)[1]))
        print("saved /tmp/sharecard_real.png")
    else:
        print("no data url:", str(data_url)[:60])
    b.close()
