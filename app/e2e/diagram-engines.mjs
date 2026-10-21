// The diagram loader in every engine, through dom.js's own renderDiagram (Firefox can't run the
// app headless, so this drives the loader without it): a module whose first two fetches are
// cut still draws, and one that never loads ends as a "load:" error, which diagram.rs shows as
// the source.
//
//   bun diagram-engines.mjs [base-url]

import { chromium, firefox, webkit } from "playwright";
import { base, check, done } from "./lib.mjs";

const SOURCE = "flowchart LR\n  A[Salted UUID] --> B[Wyhash] --> C[stats]";
const THEME = JSON.stringify({ paper: "#F4EFE4", ink: "#1B1814", muted: "#665E52", rule: "#D9D0C0", accent: "#1F55C2", stops: ["#3C60BC", "#1F7549", "#88600C", "#AD4826", "#8A4BA8"] });
const dom = (await (await fetch(base + "/")).text()).match(/"((?:\/b\/[0-9a-f]{16})?\/snippets\/[\w-]+\/js\/dom\.js)"/)[1];

const scenarios = [
    { name: "draws after its first two fetches of each module are cut", cut: 2, drawn: true },
    { name: "ends as a load error when the kind's module never loads", cut: Infinity, only: "flowchart", drawn: false },
];
const engines = [
    ["chromium", chromium, {}],
    ["webkit", webkit, {}],
    ["firefox", firefox, {}],
];

for (const [engine, type, launch] of engines) {
    const browser = await type.launch(launch);
    for (const s of scenarios) {
        const page = await browser.newPage();
        const asked = {};
        await page.route(/\/diagrams\/\w+\.js(\?|$)/, (r) => {
            const name = new URL(r.request().url()).pathname.match(/(\w+)\.js$/)[1];
            asked[name] = (asked[name] ?? 0) + 1;
            return (!s.only || s.only === name) && asked[name] <= s.cut ? r.abort("connectionreset") : r.continue();
        });
        await page.goto(base + "/robots.txt");
        const got = await page.evaluate(
            async ({ dom, SOURCE, THEME }) => {
                const { renderDiagram } = await import(dom);
                const font = new Uint8Array(await (await fetch("/fonts-v1/Inter.ttf")).arrayBuffer());
                return new Promise((resolve) =>
                    renderDiagram("1", SOURCE, THEME, 640, 2, font, (key, w, h, cw, ch, rgba, error) => resolve({ w, h, px: rgba.length, error })),
                );
            },
            { dom, SOURCE, THEME },
        );
        const tag = `${engine}: ${s.name}`;
        if (s.drawn) {
            check(got.error === "" && got.w > 0 && got.px === got.w * got.h * 4, `${tag} (${got.w}x${got.h}${got.error && `, ${got.error}`})`);
            check(asked.diagrams === 3 && asked.flowchart === 3, `${tag}: each module asked for three times ${JSON.stringify(asked)}`);
        } else {
            check(got.error.startsWith("load:") && got.w === 0, `${tag} (${got.error.slice(0, 60)})`);
            check(asked.flowchart === 3, `${tag}: given up after three asks ${JSON.stringify(asked)}`);
        }
        await page.close();
    }
    await browser.close();
}
done();
