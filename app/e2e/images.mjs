// A post's photographs come resized from wsrv.nl in the browser (it turns the Worker away), and
// when wsrv.nl doesn't answer (Safari's fetches to it fail at times) the same photographs come
// through the Worker instead. The home's Glass photograph does the same through its proxy.
//
//   bun images.mjs [base-url]

import { base, open, check, done, cut } from "./lib.mjs";

const SERIES = "/art/1791519648658-datamosh";

/** Every image response the page gets while it settles: [host, path, status, type]. */
async function images(kind, to, { refuse = false } = {}) {
    const { browser, context, page } = await open(kind);
    // the list view, where the home shows its Glass photograph
    await page.addInitScript(() => localStorage.setItem("burin.view", "list"));
    const wsrv = refuse ? await cut(context, /^https:\/\/wsrv\.nl\//, Infinity) : null;
    const seen = [];
    page.on("response", (r) => {
        const type = r.headers()["content-type"] ?? "";
        if (type.startsWith("image/")) {
            const u = new URL(r.url());
            seen.push({ host: u.host, path: u.pathname, status: r.status(), type });
        }
    });
    await page.goto(base + to);
    await page.waitForTimeout(6000);
    for (let i = 0; i < 4; i++) {
        await page.keyboard.press("PageDown");
        await page.waitForTimeout(800);
    }
    await browser.close();
    return { seen, refused: wsrv?.asked ?? 0 };
}

const fromWorker = (s) => !s.host.startsWith("wsrv.nl") && (s.path.startsWith("/img/") || s.path === "/api/app/glass-image");

for (const kind of ["desktop", "phone"]) {
    const plain = await images(kind, SERIES);
    const resized = plain.seen.filter((s) => s.host === "wsrv.nl" && s.status === 200);
    check(resized.length > 0 && resized.every((s) => s.type === "image/webp"), `${kind}: the series' photographs come resized from wsrv.nl (${resized.length})`);
    check(!plain.seen.some(fromWorker), `${kind}: and none through the Worker`);

    const refused = await images(kind, SERIES, { refuse: true });
    const local = refused.seen.filter((s) => fromWorker(s) && s.status === 200);
    check(refused.refused > 0 && local.length >= resized.length, `${kind}: with wsrv.nl refusing (${refused.refused} asks), they come through the Worker (${local.length})`);
}

{
    const refused = await images("desktop", "/", { refuse: true });
    check(refused.seen.some((s) => s.path === "/api/app/glass-image" && s.status === 200), "with wsrv.nl refusing, the home's Glass photograph comes through its proxy");
}
done();
