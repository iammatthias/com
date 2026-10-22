// Text selection: on a desktop a drag, double, triple and shift clicks, Cmd+C, Cmd+A and the
// I-beam; on a phone a long press with handles and a Copy pill. Every desktop check is "make
// the gesture, copy, read the clipboard back".
//
//   bun select.mjs [base-url]

import { base, open, check, done, path } from "./lib.mjs";

const POST = "/posts/1788199665000-whats-the-frequency-kenneth";
const mod = process.platform === "darwin" ? "Meta" : "Control";

const cursorAt = async (page, x, y) => {
    await page.mouse.move(x, y);
    await page.waitForTimeout(15);
    return page.evaluate(() => document.body.style.cursor);
};

// the rows of text under x, read off the cursor gpui sets (an I-beam over a block, a hand on a link)
async function textRows(page, x, from, to, step = 6) {
    const rows = [];
    let run = null;
    for (let y = from; y <= to; y += step) {
        const text = ["text", "pointer"].includes(await cursorAt(page, x, y));
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

const copy = async (page) => {
    await page.keyboard.press(`${mod}+c`);
    await page.waitForTimeout(300);
    return page.evaluate(() => navigator.clipboard.readText());
};
const seed = (page) => page.evaluate(() => navigator.clipboard.writeText("sentinel"));
// what the app drew: the selected text, its highlight rects, and the Copy pill if drawn
const selection = (page) => page.evaluate(() => JSON.parse(window.wasmBindings.selection_debug()));

// to where the paragraphs are, past the title and contents
async function toParagraphs(page) {
    await page.goto(base + POST);
    await page.waitForTimeout(8000);
    await page.mouse.move(640, 400);
    await page.mouse.wheel(0, 520);
    await page.waitForTimeout(1500);
}

{
    const { browser, context, page, errors } = await open("desktop");
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });
    await toParagraphs(page);

    // blocks of text in the column, by the cursor
    const blocks = await textRows(page, 640, 140, 780);
    check(blocks.length >= 3, `the cursor finds text blocks (${blocks.length})`);
    const [a, b] = [blocks[1], blocks[2]];

    await seed(page);
    await page.mouse.move(400, mid(a));
    await page.mouse.down();
    await page.mouse.move(600, mid(b), { steps: 8 });
    await page.mouse.up();
    let text = await copy(page);
    check(text.includes("\n\n") && text.length > 40, `a drag across two blocks copies both: ${JSON.stringify(text.slice(0, 60))}`);
    check(path(page) === POST, "a drag that ends on the page stays on it");

    await page.mouse.dblclick(500, mid(a));
    text = await copy(page);
    check(/^\S+$/.test(text), `a double click copies one word: ${JSON.stringify(text)}`);

    await page.mouse.click(500, mid(a), { clickCount: 3 });
    text = await copy(page);
    check(!text.includes("\n\n") && text.length > 40, `a triple click copies the block: ${JSON.stringify(text.slice(0, 40))}`);

    // a fresh single click (elsewhere first, and past the 400ms a repeat click counts within)
    // leaves a caret a shift-click extends from
    await page.mouse.click(270, 400);
    await page.waitForTimeout(500);
    await page.mouse.click(500, mid(a));
    await page.waitForTimeout(500);
    await page.keyboard.down("Shift");
    await page.mouse.click(600, mid(b));
    await page.keyboard.up("Shift");
    text = await copy(page);
    check(text.includes("\n\n"), `shift-click after a plain click extends into the next block: ${JSON.stringify(text.slice(0, 40))}`);

    await seed(page);
    // the page's own margin, beside the column
    await page.mouse.click(270, 400);
    text = await copy(page);
    check(text === "sentinel" && path(page) === POST, `a click elsewhere clears (clipboard still ${JSON.stringify(text)})`);

    await page.keyboard.press(`${mod}+a`);
    text = await copy(page);
    check(text.includes("Number stations") && text.length > 2000, `select all copies the page body (${text.length} chars)`);

    const cursor = await cursorAt(page, 500, mid(a));
    check(cursor === "text", `the I-beam shows over text (${cursor})`);

    // the browser's own copy command (Edit > Copy) fires the copy event the app answers
    await page.mouse.click(500, mid(a), { clickCount: 3 });
    await seed(page);
    const ran = await page.evaluate(() => document.execCommand("copy"));
    await page.waitForTimeout(300);
    text = await page.evaluate(() => navigator.clipboard.readText());
    check(ran && text !== "sentinel" && text.length > 40 && !text.includes("\n\n"), `the copy command copies the selection: ${JSON.stringify(text.slice(0, 40))}`);

    // links: scan a row for the pointing hand, then find the link's edges to the pixel (its
    // hitboxes are its glyphs' rects)
    await page.mouse.click(270, 400);
    let link = null;
    for (const row of blocks.slice(1)) {
        for (let x = 320; x < 960 && !link; x += 8) {
            if ((await cursorAt(page, x, mid(row))) === "pointer") link = { x, y: mid(row) };
        }
        if (link) break;
    }
    check(link !== null, "a link shows the pointing hand");
    if (link) {
        let [l, r] = [link.x, link.x];
        while ((await cursorAt(page, l - 1, link.y)) === "pointer") l--;
        while ((await cursorAt(page, r + 1, link.y)) === "pointer") r++;
        const stays = async (what) => {
            await page.waitForTimeout(800);
            check(path(page) === POST && context.pages().length === 1, what);
            await page.waitForTimeout(500);
        };
        // the right half of the character before the link: its nearest caret is the link's
        // first, and it is still not the link
        await page.mouse.click(l - 1, link.y);
        await stays("a click just before a link does not follow it");
        await seed(page);
        await page.mouse.move(l + 3, link.y);
        await page.mouse.down();
        await page.mouse.move(l + 90, link.y + 60, { steps: 8 });
        await page.mouse.up();
        text = await copy(page);
        check(text !== "sentinel" && text.length > 10, `a drag from a link selects: ${JSON.stringify(text.slice(0, 30))}`);
        await stays("a drag from a link does not follow it");
        // the right half of the link's last character: its nearest caret is past the link
        const opened = context.waitForEvent("page", { timeout: 5000 }).then(() => true, () => false);
        const moved = page.waitForURL((u) => new URL(u).pathname !== POST, { timeout: 5000 }).then(() => true, () => false);
        await page.mouse.click(r, link.y);
        const went = await Promise.all([opened, moved]);
        check(went.includes(true), "a click at the end of a link follows it");
    }

    // every kind of text on a page copies: the title, a code block, table cells, a caption,
    // the colophon
    await page.goto(base + "/posts/1784126858578-post-ui");
    await page.waitForTimeout(8000);
    await page.mouse.click(270, 400);
    await page.keyboard.press(`${mod}+a`);
    text = await copy(page);
    for (const [what, needle] of [
        ["the title", "Post-UI\n\n"],
        ["a code block", "latitude:n,\n  longitude:n,"],
        ["a table row, cells tabbed", "Hacker News\t8.4 KB\t0.4 s"],
        ["a caption", "The exact weather JSON beside the interface"],
        ["a colophon row", "PUBLISHED\t15 July 2026"],
    ]) {
        check(text.includes(needle), `select all takes in ${what}`);
    }

    // an empty table cell keeps its tab: this post's table has an empty first header cell
    await page.goto(base + "/posts/1747182886660-single-origin-deployment-with-bhvr");
    await page.waitForTimeout(8000);
    await page.mouse.click(270, 400);
    await page.keyboard.press(`${mod}+a`);
    text = await copy(page);
    const at = text.indexOf("Old\tNew");
    check(text.includes("\n\tOld\tNew"), `an empty table cell copies as its tab: ${JSON.stringify(text.slice(Math.max(0, at - 8), at + 12))}`);

    // with page text selected, a copy inside the find box is still the box's own
    await page.keyboard.press("Slash");
    await page.waitForTimeout(500);
    await page.keyboard.type("pizza", { delay: 40 });
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.press(`${mod}+c`);
    await page.waitForTimeout(300);
    text = await page.evaluate(() => navigator.clipboard.readText());
    const typed = await page.evaluate(() => document.querySelector("input[aria-label='Find a title']")?.value);
    check(typed.length > 2 && text === typed, `a copy inside the find box takes the box's text (${JSON.stringify(text.slice(0, 20))} for ${JSON.stringify(typed)})`);
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // on the home plate the page is gone, and so is anything to select
    await seed(page);
    await page.mouse.click(57, 37);
    await page.waitForTimeout(4000);
    await page.keyboard.press(`${mod}+a`);
    text = await copy(page);
    check(path(page) === "/" && text === "sentinel", `home has nothing to select or copy (${JSON.stringify(text.slice(0, 20))})`);

    check(errors.length === 0, `no page errors ${errors.join(" | ")}`);
    await browser.close();
}

// a phone-wide column, in Chrome for the mouse and the clipboard: the colophon's record id is
// truncated in the middle, and copies whole
{
    const { browser, context, page, errors } = await open("desktop", { viewport: { width: 390, height: 844 } });
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });
    const { doc } = await (await fetch(base + "/api/app/route?path=" + POST)).json();
    await page.goto(base + POST);
    await page.waitForTimeout(8000);
    // to the end, then back up past the related posts to the colophon
    await page.mouse.move(195, 500);
    for (let i = 0; i < 40; i++) await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(1000);
    await page.mouse.wheel(0, -700);
    await page.waitForTimeout(1500);
    // the value column: the record row is the last of the rows the I-beam finds (the Source
    // row under it is a link, with a hand)
    let text = "";
    let rect = null;
    for (const row of (await textRows(page, 200, 100, 840, 4)).reverse()) {
        if ((await cursorAt(page, 200, mid(row))) !== "text") continue;
        await page.mouse.click(200, mid(row), { clickCount: 3 });
        text = await copy(page);
        if (text.startsWith("baf")) {
            rect = (await selection(page)).rects[0];
            break;
        }
        await page.waitForTimeout(500);
    }
    check(text === doc.cid, `the whole record id copies untruncated: ${JSON.stringify(text)}`);
    check(rect && rect[2] < doc.cid.length * 6, `the column is too narrow for it (${rect?.[2]}px drawn for ${doc.cid.length} characters)`);
    check(errors.length === 0, `no page errors at phone width ${errors.join(" | ")}`);
    await browser.close();
}

// a plain http origin has no navigator.clipboard: a copy falls back to the browser's copy
// command instead of throwing through wasm
{
    const { browser, context, page, errors } = await open("desktop");
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });
    await context.addInitScript(() => {
        const real = navigator.clipboard;
        Object.defineProperty(navigator, "clipboard", { get: () => (window.__clipboard ? real : undefined), configurable: true });
    });
    const withClipboard = async (f) => {
        await page.evaluate(() => (window.__clipboard = true));
        const r = await page.evaluate(f);
        await page.evaluate(() => (window.__clipboard = false));
        return r;
    };
    await toParagraphs(page);
    const blocks = await textRows(page, 640, 140, 780);
    await withClipboard(() => navigator.clipboard.writeText("sentinel"));
    await page.mouse.click(500, mid(blocks[1]), { clickCount: 3 });
    await page.keyboard.press(`${mod}+c`);
    await page.waitForTimeout(300);
    const text = await withClipboard(() => navigator.clipboard.readText());
    check(text !== "sentinel" && text.length > 40, `without navigator.clipboard, Cmd+C copies through the copy command: ${JSON.stringify(text.slice(0, 40))}`);
    check(errors.length === 0, `no page errors without a clipboard API ${errors.join(" | ")}`);
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
    // a long press on text: a paragraph gap selects nothing, so try a few rows
    const longPressText = async (ys) => {
        let sel = { text: "" };
        for (const y of ys) {
            await longPress(120, y);
            sel = await selection(page);
            if (sel.text) break;
        }
        return sel;
    };

    // past the title: a screen of paragraphs
    await swipe(196, 560, 160);
    await page.waitForTimeout(2500);
    const sel = await longPressText([330, 360, 390, 420, 450]);
    check(/^\S+$/.test(sel.text), `a long press selects a word: ${JSON.stringify(sel.text)}`);
    const [rx, ry, rw, rh] = sel.rects[0] ?? [];
    check(sel.rects.length === 1 && sel.pill && sel.pill[1] < ry, `the word has one highlight rect and a Copy pill drawn above it (${JSON.stringify(sel.pill)})`);
    await page.screenshot({ path: "shots/select-phone-word.png" }).catch(() => {});

    // the end handle's knob sits under the selection's last line: drag it a line down
    const knob = { x: rx + rw, y: ry + rh + 7 };
    await touch("pointerdown", knob.x, knob.y);
    for (let i = 1; i <= 8; i++) {
        await touch("pointermove", knob.x + i * 8, knob.y + i * 4);
        await page.waitForTimeout(30);
    }
    await touch("pointerup", knob.x + 64, knob.y + 32);
    await page.waitForTimeout(400);
    const grown = await selection(page);
    check(grown.text.length > sel.text.length && grown.text.startsWith(sel.text), `dragging a handle extends the selection: ${JSON.stringify(grown.text.slice(0, 40))}`);
    await page.screenshot({ path: "shots/select-phone-handle.png" }).catch(() => {});

    // a slow swipe down (held still before the lift, so it doesn't fling) still scrolls, and
    // the selection rides with the text
    const before = (await selection(page)).rects[0][1];
    await touch("pointerdown", 300, 300);
    for (let i = 1; i <= 10; i++) {
        await touch("pointermove", 300, 300 + i * 8);
        await page.waitForTimeout(40);
    }
    await page.waitForTimeout(400);
    await touch("pointerup", 300, 380);
    await page.waitForTimeout(1500);
    const after = await selection(page);
    const dy = after.rects[0]?.[1] - before;
    check(after.text === grown.text && dy > 40 && dy < 120, `a vertical swipe scrolls with the selection kept (moved ${dy}px)`);

    // the Copy pill writes the clipboard and the selection goes
    await tap(after.pill[0] + 28, after.pill[1] + 16);
    const copied = await page.evaluate(() => window.__copied);
    check(copied.at(-1) === grown.text, `tapping Copy writes the clipboard: ${JSON.stringify(copied.at(-1)?.slice(0, 40))}`);
    check((await selection(page)).text === "", "the selection clears after Copy");

    // a tap elsewhere clears
    await longPress(120, ry + dy + rh / 2);
    check((await selection(page)).text !== "", "a second long press selects again");
    await tap(196, 120);
    check((await selection(page)).text === "", "a tap elsewhere clears");

    // a selection up against the controls at the top puts the pill below itself instead
    const high = await longPressText([118, 130, 142]);
    const last = high.rects.at(-1) ?? [];
    check(high.text !== "" && high.pill && high.pill[1] > last[1] + last[3], `the Copy pill sits below a selection near the top (pill y ${high.pill?.[1]}, text to ${last[1] + last[3]})`);
    await page.screenshot({ path: "shots/select-phone-pill-below.png" }).catch(() => {});

    check(errors.length === 0, `no page errors on the phone ${errors.join(" | ")}`);
    await browser.close();
}

done();
