// Text selection: on a desktop a drag, double, triple and shift clicks, Cmd+C, Cmd+A and the
// I-beam; on a phone a long press with handles and a Copy pill. Every desktop check is "make
// the gesture, copy, read the clipboard back".
//
//   bun select.mjs [base-url]

import { base, open, check, done, path } from "./lib.mjs";

const POST = "/posts/1788199665000-whats-the-frequency-kenneth";
const mod = process.platform === "darwin" ? "Meta" : "Control";

// the rows of text under x, read off the cursor gpui sets (an I-beam over a block, a hand on a link)
async function textRows(page, x, from, to, step = 6) {
    const rows = [];
    let run = null;
    for (let y = from; y <= to; y += step) {
        await page.mouse.move(x, y);
        await page.waitForTimeout(20);
        const text = ["text", "pointer"].includes(await page.evaluate(() => document.body.style.cursor));
        if (text && !run) run = { top: y, bottom: y };
        else if (text) run.bottom = y;
        else if (run) {
            rows.push(run);
            run = null;
        }
    }
    if (run) rows.push(run);
    return rows;
}

const mid = (r) => (r.top + r.bottom) / 2;

{
    const { browser, context, page, errors } = await open("desktop");
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });
    await page.goto(base + POST);
    await page.waitForTimeout(8000);
    // past the title and contents, to where the paragraphs are
    await page.mouse.move(640, 400);
    await page.mouse.wheel(0, 520);
    await page.waitForTimeout(1500);
    const copy = async () => {
        await page.keyboard.press(`${mod}+c`);
        await page.waitForTimeout(300);
        return page.evaluate(() => navigator.clipboard.readText());
    };
    const seed = () => page.evaluate(() => navigator.clipboard.writeText("sentinel"));

    // blocks of text in the column, by the cursor
    const blocks = await textRows(page, 640, 140, 780);
    check(blocks.length >= 3, `the cursor finds text blocks (${blocks.length})`);
    const [a, b] = [blocks[1], blocks[2]];

    await seed();
    await page.mouse.move(400, mid(a));
    await page.mouse.down();
    await page.mouse.move(600, mid(b), { steps: 8 });
    await page.mouse.up();
    let text = await copy();
    check(text.includes("\n\n") && text.length > 40, `a drag across two blocks copies both: ${JSON.stringify(text.slice(0, 60))}`);
    check(path(page) === POST, "a drag that ends on the page stays on it");

    await page.mouse.dblclick(500, mid(a));
    text = await copy();
    check(/^\S+$/.test(text), `a double click copies one word: ${JSON.stringify(text)}`);

    await page.mouse.click(500, mid(a), { clickCount: 3 });
    text = await copy();
    check(!text.includes("\n\n") && text.length > 40, `a triple click copies the block: ${JSON.stringify(text.slice(0, 40))}`);

    await page.mouse.click(500, mid(a));
    await page.keyboard.down("Shift");
    await page.mouse.click(600, mid(b));
    await page.keyboard.up("Shift");
    text = await copy();
    check(text.includes("\n\n"), `shift-click extends into the next block: ${JSON.stringify(text.slice(0, 40))}`);

    await seed();
    // the page's own margin, beside the column
    await page.mouse.click(270, 400);
    text = await copy();
    check(text === "sentinel" && path(page) === POST, `a click elsewhere clears (clipboard still ${JSON.stringify(text)})`);

    await page.keyboard.press(`${mod}+a`);
    text = await copy();
    check(text.includes("Number stations") && text.length > 2000, `select all copies the page body (${text.length} chars)`);

    await page.mouse.move(500, mid(a));
    await page.waitForTimeout(50);
    const cursor = await page.evaluate(() => document.body.style.cursor);
    check(cursor === "text", `the I-beam shows over text (${cursor})`);

    // a plain click on a link navigates: scan a row for the pointing hand
    await page.mouse.click(270, 400);
    let link = null;
    for (const row of blocks.slice(1)) {
        for (let x = 320; x < 960 && !link; x += 8) {
            await page.mouse.move(x, mid(row));
            await page.waitForTimeout(15);
            if ((await page.evaluate(() => document.body.style.cursor)) === "pointer") link = { x, y: mid(row) };
        }
        if (link) break;
    }
    check(link !== null, "a link shows the pointing hand");
    if (link) {
        await page.mouse.click(link.x, link.y);
        await page.waitForTimeout(1500);
        check(path(page) !== POST || context.pages().length > 1, "a plain click on a link navigates");
    }

    check(errors.length === 0, `no page errors ${errors.join(" | ")}`);
    await browser.close();
}

done();
