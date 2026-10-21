// Load profile: how long until the app is up and the plate is drawn, on a throttled
// "phone" (4x CPU, ~10Mbps, 40ms) and unthrottled, with what was fetched when.
//
//   bun loadperf.mjs [base-url] [runs] [path]

import { chromium } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:8795";
const runs = Number(process.argv[3] ?? 2);
const path = process.argv[4] ?? "/";

async function once(throttle) {
    const b = await chromium.launch({ args: ["--enable-unsafe-webgpu", "--use-angle=swiftshader"] });
    const c = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 1 });
    await c.addCookies([{ name: "burin", value: "1", url: base }]);
    const p = await c.newPage();
    const cdp = await c.newCDPSession(p);
    await cdp.send("Network.enable");
    if (throttle) {
        await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 40, downloadThroughput: (10 * 1024 * 1024) / 8, uploadThroughput: (2 * 1024 * 1024) / 8 });
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    }
    await p.addInitScript(() => {
        window.__marks = {};
        new MutationObserver(() => {
            if (!window.__marks.canvas && document.querySelector("canvas")) window.__marks.canvas = performance.now();
            if (window.__marks.canvas && !window.__marks.bootGone && !document.getElementById("boot")) window.__marks.bootGone = performance.now();
        }).observe(document, { childList: true, subtree: true });
    });
    await p.goto(base + path);
    await p.waitForFunction(() => window.__marks.bootGone, null, { timeout: 120000 });
    await p.waitForTimeout(1500);
    const r = await p.evaluate(() => ({
        marks: window.__marks,
        res: performance.getEntriesByType("resource").map((e) => ({ n: e.name.replace(location.origin, "").slice(0, 40), s: Math.round(e.startTime), d: Math.round(e.responseEnd), kb: Math.round(e.transferSize / 1024) })),
        nav: performance.getEntriesByType("navigation")[0].responseEnd,
    }));
    await b.close();
    return r;
}

for (const throttle of [false, true]) {
    for (let i = 0; i < runs; i++) {
        const r = await once(throttle);
        console.log(`${throttle ? "phone-ish" : "fast"} run ${i + 1}: html ${Math.round(r.nav)}ms, canvas ${Math.round(r.marks.canvas)}ms, drawn ${Math.round(r.marks.bootGone)}ms`);
        if (i === 0) for (const e of r.res.filter((e) => e.kb > 20 || /api/.test(e.n))) console.log(`   ${e.n.padEnd(42)} ${String(e.s).padStart(6)} → ${String(e.d).padStart(6)}  ${e.kb}KB`);
    }
}
