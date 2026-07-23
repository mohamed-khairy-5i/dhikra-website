#!/usr/bin/env python3
"""Full-site sweep: load every HTML page, collect console errors and
validate every JSON-LD block parses. Ignores benign View Transition notices.
"""
import glob, json, os, sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8080/"
pages = sorted(os.path.basename(p) for p in glob.glob("/home/user/webapp/*.html"))
IGNORE = ("Transition was skipped",)

total_err = 0
total_jsonld = 0
bad_jsonld = 0

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(service_workers="block")
    for name in pages:
        errs = []
        pg = ctx.new_page()
        pg.on("console", lambda m, e=errs: e.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda ex, e=errs: e.append(str(ex)))
        try:
            pg.goto(BASE + name, wait_until="networkidle", timeout=20000)
            pg.wait_for_timeout(500)
        except Exception as ex:
            errs.append("NAV: " + str(ex))
        # validate JSON-LD
        blocks = pg.eval_on_selector_all(
            'script[type="application/ld+json"]', "els => els.map(e => e.textContent)"
        )
        page_bad = 0
        for blk in blocks:
            total_jsonld += 1
            try:
                json.loads(blk)
            except Exception:
                page_bad += 1; bad_jsonld += 1
        real = [e for e in errs if not any(g in e for g in IGNORE)]
        total_err += len(real)
        flag = "OK" if not real and not page_bad else "FAIL"
        extra = ""
        if real: extra += f" errors={real}"
        if page_bad: extra += f" bad_jsonld={page_bad}"
        print(f"[{flag}] {name} (ld={len(blocks)}){extra}")
        pg.close()
    b.close()

print(f"\n=== SUMMARY: {len(pages)} pages | console errors={total_err} | JSON-LD blocks={total_jsonld} bad={bad_jsonld} ===")
sys.exit(1 if (total_err or bad_jsonld) else 0)
