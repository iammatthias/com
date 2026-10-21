// Diagrams in the app come from modules imported on first need (diagrams.js, then the kind's
// own): two cut fetches of each aren't final, the page asks again by itself under fresh URLs
// and draws; a kind's module that never loads leaves the source on the page, with one warning.
// diagram-engines.mjs covers the same loader in WebKit and Firefox.
//
//   bun diagram.mjs [base-url] [screenshot-dir]

import { base, open, check, done } from "./lib.mjs";

const POST = "/posts/1775137360175-i-got-a-common-turtle";
const shots = process.argv[3];

async function visit(name, cut) {
    const { browser, context, page } = await open("desktop");
    await page.setViewportSize({ width: 1280, height: 1800 });
    const asked = {};
    const warned = [];
    page.on("console", (m) => m.text().startsWith("diagram:") && warned.push(m.text().slice(0, 120)));
    await context.route(/\/diagrams\/\w+\.js/, (r) => {
        const module = new URL(r.request().url()).pathname.match(/(\w+)\.js$/)[1];
        asked[module] = (asked[module] ?? 0) + 1;
        return asked[module] <= cut(module) ? r.abort("failed") : r.continue();
    });
    await page.goto(base + POST);
    for (let i = 0; i < 40 && (asked.flowchart ?? 0) < 3; i++) await page.waitForTimeout(500);
    await page.waitForTimeout(2500);
    if (shots) await page.screenshot({ path: `${shots}/diagram-${name}.png` });
    await browser.close();
    return { asked, warned };
}

const cut = await visit("cut", () => 2);
check(cut.asked.diagrams === 3 && cut.asked.flowchart === 3, `two cut fetches of each module are asked for again ${JSON.stringify(cut.asked)}`);
check(cut.warned.length === 0, `and nothing failed ${JSON.stringify(cut.warned)}`);

const never = await visit("never", (module) => (module === "flowchart" ? Infinity : 0));
check(never.asked.flowchart === 3, `a module that never loads is given up on after three asks ${JSON.stringify(never.asked)}`);
check(never.warned.length === 1 && never.warned[0].startsWith("diagram: load:"), `with one warning, the source drawn instead ${JSON.stringify(never.warned)}`);
done();
