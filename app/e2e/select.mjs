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

// a phone: WebKit as an iPhone, touches as pointer events on the canvas (what gpui reads)
{
    const { browser, context, page, errors } = await open("phone");
    // WebKit grants no clipboard read to a test: record what the app writes instead
    await context.addInitScript(() => {
        window.__copied = [];
        const write = (t) => {
            window.__copied.push(t);
            return Promise.resolve();
        };
        Object.defineProperty(navigator, "clipboard", { value: { writeText: write }, configurable: true });
    });
    await page.goto(base + POST);
    await page.waitForTimeout(8000);
    const touch = (type, x, y, id = 7) =>
        page.evaluate(
            ([type, x, y, id]) =>
                document.querySelector("canvas").dispatchEvent(
                    new PointerEvent(type, { pointerType: "touch", pointerId: id, isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true, buttons: type === "pointerup" ? 0 : 1 }),
                ),
            [type, x, y, id],
        );
    const swipe = async (x, y0, y1, steps = 12) => {
        await touch("pointerdown", x, y0);
        for (let i = 1; i <= steps; i++) {
            await touch("pointermove", x, y0 + ((y1 - y0) * i) / steps);
            await page.waitForTimeout(30);
        }
        await touch("pointerup", x, y1);
    };
    const longPress = async (x, y) => {
        await touch("pointerdown", x, y);
        await page.waitForTimeout(750);
        await touch("pointerup", x, y);
        await page.waitForTimeout(400);
    };
    const tap = async (x, y) => {
        await touch("pointerdown", x, y);
        await page.waitForTimeout(40);
        await touch("pointerup", x, y);
        await page.waitForTimeout(400);
    };
    const selection = () => page.evaluate(() => JSON.parse(window.wasmBindings.selection_debug()));

    // past the title: a screen of paragraphs
    await swipe(196, 560, 160);
    await page.waitForTimeout(2500);
    // a long press on text: try a few rows, a paragraph gap selects nothing
    let sel = { text: "" };
    for (const y of [330, 360, 390, 420, 450]) {
        await longPress(120, y);
        sel = await selection();
        if (sel.text) break;
    }
    check(/^\S+$/.test(sel.text), `a long press selects a word: ${JSON.stringify(sel.text)}`);
    check(sel.rects.length === 1 && sel.pill, "the word has one highlight rect and a Copy pill");
    await page.screenshot({ path: "shots/select-phone-word.png" }).catch(() => {});

    // the end handle's knob sits under the selection's last line: drag it a line down
    const [rx, ry, rw, rh] = sel.rects[0];
    const knob = { x: rx + rw, y: ry + rh + 7 };
    await touch("pointerdown", knob.x, knob.y);
    for (let i = 1; i <= 8; i++) {
        await touch("pointermove", knob.x + i * 8, knob.y + i * 4);
        await page.waitForTimeout(30);
    }
    await touch("pointerup", knob.x + 64, knob.y + 32);
    await page.waitForTimeout(400);
    const grown = await selection();
    check(grown.text.length > sel.text.length && grown.text.startsWith(sel.text), `dragging a handle extends the selection: ${JSON.stringify(grown.text.slice(0, 40))}`);
    await page.screenshot({ path: "shots/select-phone-handle.png" }).catch(() => {});

    // a slow swipe down (held still before the lift, so it doesn't fling) still scrolls, and
    // the selection rides with the text
    const before = (await selection()).rects[0][1];
    await touch("pointerdown", 300, 300);
    for (let i = 1; i <= 10; i++) {
        await touch("pointermove", 300, 300 + i * 8);
        await page.waitForTimeout(40);
    }
    await page.waitForTimeout(400);
    await touch("pointerup", 300, 380);
    await page.waitForTimeout(1500);
    const after = await selection();
    const dy = after.rects[0]?.[1] - before;
    check(after.text === grown.text && dy > 40 && dy < 120, `a vertical swipe scrolls with the selection kept (moved ${dy}px)`);

    // the Copy pill writes the clipboard and the selection goes
    await tap(after.pill[0] + 28, after.pill[1] + 16);
    const copied = await page.evaluate(() => window.__copied);
    check(copied.at(-1) === grown.text, `tapping Copy writes the clipboard: ${JSON.stringify(copied.at(-1)?.slice(0, 40))}`);
    check((await selection()).text === "", "the selection clears after Copy");

    // a tap elsewhere clears
    await longPress(120, ry + dy + rh / 2);
    check((await selection()).text !== "", "a second long press selects again");
    await tap(196, 120);
    check((await selection()).text === "", "a tap elsewhere clears");

    check(errors.length === 0, `no page errors on the phone ${errors.join(" | ")}`);
    await browser.close();
}

done();
