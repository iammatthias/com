// Run from app/: `bun test js/`. A stub of the little DOM dom.js touches stands in for a browser.
import { beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function element(tag) {
    const attrs = new Map();
    return {
        tag,
        attrs,
        style: {},
        children: [],
        setAttribute: (k, v) => attrs.set(k, String(v)),
        getAttribute: (k) => attrs.get(k) ?? null,
        appendChild(child) {
            this.children.push(child);
            return child;
        },
        addEventListener() {},
        remove() {
            this.removed = true;
        },
        getBoundingClientRect: () => ({ height: 0 }),
    };
}

function fakeDocument() {
    const head = element("head");
    head.querySelector = (selector) => {
        const [, tag, attr, value] = selector.match(/^(\w+)\[([\w-]+)="([^"]*)"\]$/);
        return head.children.find((c) => c.tag === tag && c.attrs.get(attr) === value) ?? null;
    };
    const main = element("main");
    return { title: "", head, body: element("body"), createElement: element, getElementById: (id) => (id === "ssr" ? main : null), main };
}

const ssrReply = (title) => ({ kind: "ssr", title, description: `${title} described`, canonical: `https://x.test/${title}`, og: {}, html: `<p>${title}</p>` });

let dom;
let document;
let pending;
beforeEach(async () => {
    document = fakeDocument();
    pending = new Map();
    Object.assign(globalThis, {
        document,
        window: globalThis,
        location: { pathname: "/" },
        addEventListener() {},
        ResizeObserver: class {
            observe() {}
        },
        // each reply is released by the test, so late answers can be played out of order
        fetch: (url) =>
            new Promise((resolve) => {
                const path = decodeURIComponent(new URL(url, "https://x.test").searchParams.get("path"));
                pending.set(path, () => resolve(Response.json(ssrReply(path.slice(1)))));
            }),
    });
    dom ??= await import("./dom.js");
});

const settle = () => new Promise((r) => setTimeout(r, 0));

describe("syncDocument", () => {
    test("the reply for the page the reader is on lands", async () => {
        location.pathname = "/about";
        const sync = dom.syncDocument("/about");
        pending.get("/about")();
        await sync;
        expect(document.title).toBe("about");
        expect(document.head.querySelector('meta[name="description"]').getAttribute("content")).toBe("about described");
        expect(document.main.innerHTML).toBe("<p>about</p>");
    });

    test("an earlier navigation's late reply is dropped", async () => {
        location.pathname = "/first";
        const first = dom.syncDocument("/first");
        location.pathname = "/second";
        const second = dom.syncDocument("/second");
        pending.get("/second")();
        await second;
        pending.get("/first")();
        await first;
        expect(document.title).toBe("second");
        expect(document.main.innerHTML).toBe("<p>second</p>");
    });

    test("a reply for a path the address no longer shows is dropped", async () => {
        location.pathname = "/here";
        const sync = dom.syncDocument("/gone");
        pending.get("/gone")();
        await sync;
        expect(document.title).toBe("");
        expect(document.main.innerHTML).toBeUndefined();
    });

    test("a trailing slash on the address is the same page", async () => {
        location.pathname = "/posts/x/";
        const sync = dom.syncDocument("/posts/x");
        pending.get("/posts/x")();
        await sync;
        expect(document.title).toBe("posts/x");
    });

    test("a redirect target's query and fragment are not part of the page", async () => {
        location.pathname = "/x";
        const sync = dom.syncDocument("/x?y=1#z");
        pending.get("/x?y=1#z")();
        await sync;
        expect(document.title).toBe("x?y=1#z");
    });
});

describe("embeds", () => {
    const place = (key, module, attrs) => dom.embedPlace(key, "x-embed", module, JSON.stringify(attrs), "", 0, 0, 100, 0, 0, 0, 0, true);
    // the elements placed so far, in order: each host holds its component once its module loaded
    const components = () => document.body.children.map((host) => host.children[0]);
    const until = async (ready) => {
        for (let i = 0; i < 200 && !ready(); i++) await settle();
        return ready();
    };

    test("a module that failed to load is tried again by the next place", async () => {
        const module = join(mkdtempSync(join(tmpdir(), "dom-test-")), "embed.js");
        const warned = [];
        const warn = console.warn;
        console.warn = (...args) => warned.push(args);
        try {
            place("a", module, []);
            expect(await until(() => warned.length === 1)).toBe(true);
            expect(components()).toEqual([undefined]);
            writeFileSync(module, "export const loaded = true;\n");
            place("b", module, [["origin", "https://x.test"]]);
            expect(await until(() => components()[1])).toBeTruthy();
            expect(components()[1].tag).toBe("x-embed");
            expect(warned.length).toBe(1);
        } finally {
            console.warn = warn;
        }
    });

    test("props never become inline handlers", async () => {
        const module = join(mkdtempSync(join(tmpdir(), "dom-test-")), "embed.js");
        writeFileSync(module, "export const loaded = true;\n");
        place("c", module, [["origin", "https://x.test"], ["onclick", "alert(1)"], ["ONLoad", "alert(2)"], ["station", "on-air"]]);
        const el = await until(() => components()[0]);
        expect([...el.attrs]).toEqual([["origin", "https://x.test"], ["station", "on-air"]]);
    });
});
