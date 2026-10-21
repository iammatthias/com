// What a page loads after boot recovers from a flaky network by itself: an embed whose module's
// first two fetches are cut still appears; search still answers when its worker's script is cut
// once and the corpus first comes back 503 (a partial corpus, which must not be kept); a click
// whose page is cut twice still lands; and what gave up (a page, a diagram's code) tries again
// when the browser is back online. diagram.mjs and diagram-engines.mjs cover diagrams, embed-reads.mjs
// the embeds' own reads.
//
//   bun loads.mjs [base-url]

import { base, open, check, done, path, cut } from "./lib.mjs";

const EMBED = "/posts/1788199665000-whats-the-frequency-kenneth";
const PIZZA = "/posts/1731475962422-shitposting-towards-a-pizza-oven";
const TURTLE = "/posts/1775137360175-i-got-a-common-turtle";
const visit = (page, to) => page.evaluate((to) => { history.pushState(null, "", to); dispatchEvent(new PopStateEvent("popstate")); }, to);
const titled = async (page, word, ms) => {
    for (let t = 0; t < ms; t += 250) {
        if ((await page.title()).toLowerCase().includes(word)) return true;
        await page.waitForTimeout(250);
    }
    return false;
};
const online = (page) => page.evaluate(() => dispatchEvent(new Event("online")));

for (const kind of ["desktop", "phone"]) {
    const { browser, context, page } = await open(kind);
    const module = await cut(context, /\/embeds\/ff-tuner\.js(\?|$)/, 2);
    await page.goto(base + EMBED);
    let tag = null;
    for (let i = 0; i < 30 && !tag; i++) {
        await page.waitForTimeout(500);
        tag = await page.evaluate(() => document.querySelector("body > div[style*='will-change']")?.firstElementChild?.tagName ?? null);
    }
    check(tag === "FF-TUNER" && module.asked === 3, `${kind}: an embed whose first two fetches are cut appears (${tag}, ${module.asked} asks)`);
    await browser.close();
}

{
    const { browser, context, page } = await open("desktop");
    const worker = await cut(context, /\/search\/search-worker\.js(\?|$)/, 1);
    const corpus = await cut(context, /\/api\/search-corpus\.json/, 1, (r) => r.fulfill({ status: 503, contentType: "application/json", body: '{"items":[]}' }));
    await page.goto(base + "/about");
    await page.waitForTimeout(6000);
    await page.keyboard.press("Slash");
    await page.waitForTimeout(500);
    await page.keyboard.type("pizza", { delay: 60 });
    for (let i = 0; i < 30 && corpus.asked < 2; i++) await page.waitForTimeout(500);
    await page.waitForTimeout(1500);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(2500);
    check(worker.asked >= 2 && corpus.asked >= 2, `search asked again after its worker and corpus failed (${worker.asked}, ${corpus.asked} asks)`);
    check(path(page) === PIZZA, `and its first result opens (${path(page)})`);
    await browser.close();
}

{
    const { browser, context, page } = await open("desktop");
    const warned = [];
    page.on("console", (m) => m.text().startsWith("diagram:") && warned.push(m.text().slice(0, 80)));
    // the document's own fetch sets the title too: only the app's should here
    await cut(context, /\/api\/app\/ssr/, Infinity);
    const route = await cut(context, /\/api\/app\/route\?path=(%2F|\/)posts/, 2);
    const flowchart = await cut(context, /\/diagrams\/flowchart\.js(\?|$)/, 0);
    await page.goto(base + "/about");
    await page.waitForTimeout(6000);

    await visit(page, PIZZA);
    check((await titled(page, "pizza", 8000)) && route.asked === 3, `a click whose page is cut twice still lands (${route.asked} asks)`);

    route.asked = 0;
    route.n = flowchart.n = Infinity;
    await visit(page, TURTLE);
    await page.waitForTimeout(4000);
    check(!(await page.title()).toLowerCase().includes("turtle") && route.asked === 3, `a page that never answers is given up on after three asks (${route.asked})`);
    route.n = 0;
    await online(page);
    check(await titled(page, "turtle", 8000), "and back online, it loads");
    for (let i = 0; i < 20 && warned.length === 0; i++) await page.waitForTimeout(500);
    check(warned.length === 1 && flowchart.asked === 3, `its diagram's code never loads: the source, one warning (${flowchart.asked} asks)`);
    flowchart.n = 0;
    await online(page);
    await page.waitForTimeout(4000);
    check(flowchart.asked === 4 && warned.length === 1, `and back online, it's asked for again and draws (${flowchart.asked} asks, ${warned.length} warnings)`);
    await browser.close();
}
done();
