// The embeds read their own records (@com's ff-tuner.js and ff-onchain-analytics.js, mirrored as
// is) and retry those reads themselves: cut twice, the read still lands; cut for good, the
// element says so, and its Try again works once the network does. The analytics read is held to
// its record's counts, its session deep link opens that session, and no page asks conet.fm or
// sepolia.base.org for anything or trips the CSP. The tuner's pager below a page brings the next
// page's top into view, as it does on @com (the document doesn't scroll here: the canvas does). loads.mjs covers the app's import of the
// modules. The tuner reads once it's near the screen, so it's scrolled to (Chromium only; WebKit
// can't wheel). Text is read whole (textContent): the host is hidden until it's in view.
//
//   bun embed-reads.mjs [base-url]

import { base, open, check, done, cut, path } from "./lib.mjs";

const EMBEDS = [
    {
        name: "tuner",
        tag: "ff-tuner",
        post: "/posts/1788199665000-whats-the-frequency-kenneth",
        record: /^https:\/\/blobs\.farfield\.systems\/blobs\/bafkreibb4lkg5zl25empka2gd4to6ercseai2gnppjzkw4owgldi4trz4u/,
        read: /transmissions/,
        kinds: ["desktop"],
    },
    {
        name: "analytics",
        tag: "ff-onchain-analytics",
        post: "/experiments/1791937789859-onchain-analytics",
        record: /^https:\/\/blobs\.farfield\.systems\/blobs\/bafkreiekwdorblbyizygzxsxusogxpe3z7zkgv6tlccwadshmannyntb4q/,
        read: /unique sessions/,
        kinds: ["desktop", "phone"],
    },
];
const FAILED = /didn.t load/;
const OFF_LIMITS = /conet\.fm|sepolia\.base\.org/;

async function visit(kind, embed, n) {
    const { browser, context, page } = await open(kind);
    const off = [];
    context.on("request", (r) => OFF_LIMITS.test(r.url()) && off.push(r.url()));
    page.on("console", (m) => /Content Security Policy|Refused to (connect|load)/i.test(m.text()) && off.push(m.text().slice(0, 120)));
    const read = await cut(context, embed.record, n);
    await page.goto(base + embed.post);
    await page.waitForTimeout(6000);
    const state = () =>
        page.evaluate((tag) => {
            const el = document.querySelector(tag);
            const r = el?.parentElement?.getBoundingClientRect();
            const root = el?.shadowRoot;
            return { near: !!r && r.top < innerHeight + 600, text: root ? [...root.children].filter((c) => c.tagName !== "STYLE").map((c) => c.textContent).join(" ") : "", retry: !!root && [...root.querySelectorAll("button")].some((b) => /try again/i.test(b.textContent)) };
        }, embed.tag);
    if (kind === "desktop") for (let i = 0; i < 60 && !(await state()).near; i++) await page.mouse.wheel(0, 600), await page.waitForTimeout(150);
    const settled = async () => {
        let s = await state();
        for (let i = 0; i < 40 && !embed.read.test(s.text) && !FAILED.test(s.text); i++) await page.waitForTimeout(250), (s = await state());
        return s;
    };
    return { browser, page, read, off, state, settled };
}

for (const embed of EMBEDS) {
    for (const kind of embed.kinds) {
        for (const n of [0, 2, Infinity]) {
            const v = await visit(kind, embed, n);
            const s = await v.settled();
            const tag = `${kind}: the ${embed.name}'s record`;
            if (n !== Infinity) {
                check(embed.read.test(s.text) && v.read.asked === n + 1, `${tag}, cut ${n} times, is read (${v.read.asked} asks)`);
            } else {
                check(FAILED.test(s.text) && s.retry && v.read.asked === 3, `${tag}, cut for good, says so with Try again (${v.read.asked} asks)`);
                v.read.n = 0;
                await v.page.evaluate((tag) => [...document.querySelector(tag).shadowRoot.querySelectorAll("button")].find((b) => /try again/i.test(b.textContent)).click(), embed.tag);
                check(embed.read.test((await v.settled()).text), `${tag}: Try again reads it once the network's back`);
            }
            if (embed.name === "tuner" && n === 0) {
                const later = () =>
                    v.page.evaluate(() => {
                        const el = document.querySelector("ff-tuner");
                        const b = [...el.shadowRoot.querySelectorAll("button")].filter((b) => /later/i.test(b.textContent)).at(-1);
                        return { button: Math.round(b.getBoundingClientRect().top), top: Math.round(el.parentElement.getBoundingClientRect().top), page: el.shadowRoot.textContent.match(/\d+–\d+ of 869/)?.[0] };
                    });
                for (let i = 0; i < 80 && (await later()).button > 700; i++) await v.page.mouse.wheel(0, 400), await v.page.waitForTimeout(120);
                const before = await later();
                await v.page.evaluate(() => [...document.querySelector("ff-tuner").shadowRoot.querySelectorAll("button")].filter((b) => /later/i.test(b.textContent)).at(-1).click());
                await v.page.waitForTimeout(1500);
                const after = await later();
                check(before.top < -500 && after.page === "6–10 of 869" && after.top > -40 && after.top < 200, `the pager below a page brings the next one's top into view (${JSON.stringify({ before, after })})`);
            }
            if (embed.name === "analytics" && n === 0) {
                // table cells run together in textContent: compared without spaces
                const t = s.text.replace(/\s+/g, "");
                const counts = ["205 unique sessions", "between July 2024 and November 2024", "/ 769", "/onchain-analytics 167", "starting-a-spice-company 54", "/art 37", "/posts 32", "zoomOpen 14", "zoomClose 13", "share 1"];
                const missing = counts.filter((c) => !t.includes(c.replace(/\s+/g, "")));
                check(missing.length === 0, `${kind}: the analytics counts match the record ${JSON.stringify(missing)}`);
            }
            check(v.off.length === 0, `${kind}: the ${embed.name}'s page asks nothing of conet.fm or sepolia and trips no CSP ${JSON.stringify(v.off.slice(0, 3))}`);
            await v.browser.close();
        }
    }
}

{
    const SESSION = "0x710093cf49126f395b3729d5f7b7f7db57eb7ac48217b160a9c0ccef47c0e122";
    const { browser, page } = await open("desktop");
    await page.goto(`${base}/onchain-analytics/${SESSION}`);
    let open_ = null;
    for (let i = 0; i < 40 && !open_?.svg; i++) {
        await page.waitForTimeout(500);
        open_ = await page.evaluate(() => {
            const d = document.querySelector("ff-onchain-analytics")?.shadowRoot?.querySelector("details[open]");
            return d ? { hash: d.querySelector("summary")?.textContent ?? "", svg: !!d.querySelector("svg") } : null;
        });
    }
    check(path(page) === "/experiments/1791937789859-onchain-analytics" && open_?.hash.includes(SESSION) && open_.svg, `a session's deep link opens that session with its portrait (${path(page)}, ${JSON.stringify(open_)})`);
    await browser.close();
}
done();
