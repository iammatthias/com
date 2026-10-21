// The DOM around the canvas: what agents, screen readers and share sheets read.
// The app draws everything people see; this keeps the document underneath it true.

// This build's own files sit beside this one (<build>/snippets/<crate>/js/dom.js, under /b/<id>/
// once deployed, worker/scripts/scope-build.ts): code loaded later comes from the build the
// page booted with, not whatever a deploy has put at the site's root since.
const BUILD = new URL("../../../", import.meta.url);
/** The url of `path` (e.g. "search/search-worker.js") in this page's build. */
export function buildUrl(path) {
    return new URL(path, BUILD).href;
}

/** `f` whenever the network may be back: online again, or the tab looked at again (a phone's
 *  radio sleeps under a hidden tab). */
export function onReconnect(f) {
    addEventListener("online", f);
    document.addEventListener("visibilitychange", () => document.hidden || f());
}

const buildModules = new Map(); // path -> import promise
// a browser keeps a failed module import for its URL: a retry asks under a new one
const buildModuleTries = new Map();
// the waits before asking again for a module that didn't load, then it's forgotten
const MODULE_RETRY_MS = [400, 1600];

/** The module at `path` in this build, imported once; one that never loads isn't kept, so the
 *  next ask starts over. A retry is a fresh fetch only for a module that imports nothing (a
 *  failed dependency stays failed in Chromium and WebKit): diagrams/build.ts checks its own. */
function buildModule(path) {
    let m = buildModules.get(path);
    if (m) return m;
    m = (async () => {
        for (let attempt = 0; ; attempt++) {
            const tries = buildModuleTries.get(path) ?? 0;
            buildModuleTries.set(path, tries + 1);
            try {
                const url = buildUrl(path);
                return await import(tries ? `${url}?retry=${tries}` : url);
            } catch (e) {
                // the one error that's the network's, not the module's: worth another try later
                if (attempt >= MODULE_RETRY_MS.length) throw Object.assign(e instanceof Error ? e : new Error(String(e)), { code: "load" });
                await new Promise((wake) => setTimeout(wake, MODULE_RETRY_MS[attempt]));
            }
        }
    })();
    m.catch(() => buildModules.delete(path));
    buildModules.set(path, m);
    return m;
}

// After an in-app navigation, bring the head (title, description, canonical, Open Graph)
// and the server-rendered page under the canvas (<main id="ssr">) up to date. Only the
// newest navigation's reply lands: an earlier one answering late would describe a page the
// reader has already left.
let syncSeq = 0;
const pathOf = (s) => s.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
const samePath = (a, b) => pathOf(a) === pathOf(b);
export async function syncDocument(path) {
    const seq = ++syncSeq;
    try {
        const res = await fetch(`/api/app/ssr?path=${encodeURIComponent(path)}`);
        if (!res.ok) return;
        const ssr = await res.json();
        if (seq !== syncSeq || !samePath(path, location.pathname)) return;
        if (ssr.kind !== "ssr") return;
        if (ssr.title) document.title = ssr.title;
        setMeta("name", "description", ssr.description);
        setMeta("name", "robots", ssr.noindex ? "noindex" : null);
        const og = ssr.og || {};
        for (const key of ["title", "description", "image", "url", "type"]) setMeta("property", `og:${key}`, og[key]);
        setLink("canonical", ssr.canonical);
        const main = document.getElementById("ssr");
        if (main && typeof ssr.html === "string") main.innerHTML = ssr.html;
    } catch {}
}

function setMeta(attr, key, value) {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (value == null || value === "") {
        if (el) el.remove();
        return;
    }
    if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    el.setAttribute("content", value);
}

function setLink(rel, href) {
    let el = document.head.querySelector(`link[rel="${rel}"]`);
    if (!href) {
        if (el) el.remove();
        return;
    }
    if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
    }
    el.setAttribute("href", href);
}

// WebMCP: the same four tools com registers, for agents driving a browser.
export function registerWebMcp() {
    const ctx = document.modelContext ?? navigator.modelContext ?? null;
    if (!ctx || typeof ctx.registerTool !== "function") return;
    const text = (t) => ({ content: [{ type: "text", text: t }] });
    const failure = (t) => ({ ...text(t), isError: true });
    const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

    ctx.registerTool({
        name: "search_site",
        description:
            "Search this site's writing, photography notes, and recipes by keyword. Returns titles, excerpts, and both HTML and markdown URLs.",
        annotations: READ_ONLY,
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string", description: "Search terms." },
                limit: { type: "integer", description: "Maximum hits (1-50, default 10)." },
            },
            required: ["query"],
        },
        async execute({ query, limit }) {
            const qs = new URLSearchParams({ q: String(query ?? ""), limit: String(limit ?? 10) });
            const res = await fetch(`/api/search.json?${qs}`);
            if (!res.ok) {
                const problem = await res.json().catch(() => null);
                return failure(problem?.resolution ?? `Search failed (${res.status}).`);
            }
            const { hits } = await res.json();
            if (!hits.length) return text(`No results for "${query}".`);
            return text(
                hits.map((h) => `## ${h.title}\n${h.section} · ${h.published.slice(0, 10)}\n${h.excerpt}\n${h.url}`).join("\n\n"),
            );
        },
    });

    ctx.registerTool({
        name: "list_content",
        description:
            "List published entries on this site, newest first, optionally filtered to one section (art, posts, recipes, melange, experiments) or one tag.",
        annotations: READ_ONLY,
        inputSchema: {
            type: "object",
            properties: {
                section: { type: "string", description: "Section slug." },
                tag: { type: "string", description: "Tag to filter by." },
                limit: { type: "integer", description: "Maximum items." },
            },
        },
        async execute({ section, tag, limit }) {
            const qs = new URLSearchParams();
            if (section) qs.set("section", String(section));
            if (tag) qs.set("tag", String(tag));
            qs.set("limit", String(limit ?? 25));
            const res = await fetch(`/api/content.json?${qs}`);
            if (!res.ok) return failure(`Listing failed (${res.status}).`);
            const { items } = await res.json();
            return text(items.map((i) => `- ${i.published.slice(0, 10)} [${i.section}] ${i.title} — ${i.url}`).join("\n"));
        },
    });

    ctx.registerTool({
        name: "read_current_page",
        description:
            "Return the markdown source of the page currently open, with front matter and images resolved to public URLs. Cheaper and cleaner than parsing the rendered DOM.",
        annotations: READ_ONLY,
        inputSchema: { type: "object", properties: {} },
        async execute() {
            const path = location.pathname.replace(/\/$/, "");
            const res = await fetch(`${path || "/index"}.md`);
            if (!res.ok) {
                return failure(`This page has no markdown twin. Try search_site, or fetch ${location.origin}/llms.txt for the site index.`);
            }
            return text(await res.text());
        },
    });

    ctx.registerTool({
        name: "open_entry",
        description: "Navigate the browser to a specific entry on this site by its path or slug, e.g. 'posts/1779066375000-farfield'.",
        annotations: { ...READ_ONLY, readOnlyHint: false },
        inputSchema: {
            type: "object",
            properties: { path: { type: "string", description: "Entry path or slug." } },
            required: ["path"],
        },
        async execute({ path }) {
            const clean = String(path ?? "").replace(/^https?:\/\/[^/]+/, "").replace(/^[/\\]+|\.md$/g, "");
            // only ever a page of this site, however the path is written
            if (new URL(`/${clean}`, location.origin).origin !== location.origin) return failure(`"${path}" isn't a path on this site.`);
            const res = await fetch(`/${clean}.md`, { method: "HEAD" });
            if (!res.ok) return failure(`No entry at "${clean}". Use search_site or list_content to find a valid path.`);
            // in place, without a reload: the app follows history like back/forward
            history.pushState(null, "", `/${clean}`);
            dispatchEvent(new PopStateEvent("popstate"));
            return text(`Navigating to /${clean}.`);
        },
    });
}

// Touch on the canvas, read directly: gpui turns a one-finger drag into scrolling and has no
// pinch yet, but the plate wants drag to pan and pinch to zoom. Reports, in CSS px:
//   onGesture("pan", dx, dy, 0) · onGesture("pinch", factor, cx, cy) · onGesture("touch", n, 0, 0)
// where "touch" carries how many fingers are down (0 when the last lifts).
export function installTouchGestures(onGesture) {
    const pts = new Map();
    let lastMid = null;
    let lastDist = 0;
    const mid = () => {
        const a = [...pts.values()];
        return { x: a.reduce((s, p) => s + p.x, 0) / a.length, y: a.reduce((s, p) => s + p.y, 0) / a.length };
    };
    const dist = () => {
        const [a, b] = [...pts.values()];
        return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    };
    const reset = () => {
        lastMid = pts.size ? mid() : null;
        lastDist = pts.size >= 2 ? dist() : 0;
        onGesture("touch", pts.size, 0, 0);
    };
    const opts = { capture: true, passive: true };
    addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "touch") return;
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        reset();
    }, opts);
    addEventListener("pointermove", (e) => {
        if (e.pointerType !== "touch" || !pts.has(e.pointerId)) return;
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const m = mid();
        if (lastMid) onGesture("pan", m.x - lastMid.x, m.y - lastMid.y, 0);
        if (pts.size >= 2) {
            const d = dist();
            if (lastDist > 0 && d > 0) onGesture("pinch", d / lastDist, m.x, m.y);
            lastDist = d;
        }
        lastMid = m;
    }, opts);
    const end = (e) => {
        if (e.pointerType !== "touch" || !pts.delete(e.pointerId)) return;
        reset();
    };
    addEventListener("pointerup", end, opts);
    addEventListener("pointercancel", end, opts);
    installTapThroughFling();
}

// A touch that lands while a flick is still coasting only stops the scroll (gpui's recognizer,
// as on iOS), and gpui lets a flick coast until it is down to 10 px/s, long after the page looks
// still. So a tap a second or two after scrolling did nothing. Here, a tap that caught a flick
// already slow enough to read as stopped is played again once the scroll has halted: the first
// stops it, the replay is the tap. One that catches a fast scroll still only stops it.
function installTapThroughFling() {
    const SLOP = 8; // gpui's touch_slop, css px
    const DECAY = 0.998; // gpui's iOS scroll physics, per ms
    const STILL = 200; // px/s below which a coasting page reads as stopped (~3 px a frame)
    let fling = null; // { at, speed } of the last release that would coast
    const down = new Map(); // pointerId -> { x, y, at, caught, samples }
    const opts = { capture: true, passive: true };
    const residual = (now) => (fling ? fling.speed * Math.pow(DECAY, now - fling.at) : 0);
    addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "touch" || e.replayed) return;
        const now = performance.now();
        const v = residual(now);
        down.set(e.pointerId, { x: e.clientX, y: e.clientY, at: now, caught: v > 10, still: v <= STILL, samples: [[now, e.clientX, e.clientY]] });
    }, opts);
    addEventListener("pointermove", (e) => {
        const d = down.get(e.pointerId);
        if (!d) return;
        d.samples.push([performance.now(), e.clientX, e.clientY]);
        if (d.samples.length > 8) d.samples.shift();
    }, opts);
    addEventListener("pointerup", (e) => {
        const d = down.get(e.pointerId);
        if (!d || e.replayed) return;
        down.delete(e.pointerId);
        const now = performance.now();
        const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y);
        if (moved > SLOP) {
            // a pan: how fast it left the finger, as gpui will set it coasting
            const recent = d.samples.filter(([t]) => now - t < 100);
            const [t0, x0, y0] = recent[0] ?? d.samples[0];
            const dt = Math.max(now - t0, 1) / 1000;
            fling = { at: now, speed: Math.hypot(e.clientX - x0, e.clientY - y0) / dt };
            return;
        }
        if (!(d.caught && d.still) || now - d.at > 450) return;
        fling = null;
        const canvas = document.querySelector("canvas");
        if (!canvas) return;
        const x = e.clientX, y = e.clientY;
        // after gpui has handled this release (it stopped the scroll), tap again where it was
        setTimeout(() => {
            const id = 7000 + Math.floor(Math.random() * 1000);
            for (const type of ["pointerdown", "pointerup"]) {
                const ev = new PointerEvent(type, { pointerType: "touch", pointerId: id, isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true, buttons: type === "pointerdown" ? 1 : 0 });
                ev.replayed = true;
                canvas.dispatchEvent(ev);
            }
        }, 0);
    }, opts);
    addEventListener("pointercancel", (e) => down.delete(e.pointerId), opts);
}

// ---- diagrams: pele, loaded on the first page that has one, each kind's drawing when it's needed ----
// the face diagrams set in, sent once by the app and kept for a retried import
let diagramFont = null;

/**
 * Render a diagram `source` (Mermaid syntax) for the canvas: `done(key, width, height, cssWidth, cssHeight,
 * rgba, error)` gets its pixels (device px, RGBA) and the size to draw them at, or an error
 * as "code: message".
 */
export function renderDiagram(key, source, themeJson, maxWidth, dpr, font, done) {
    // a copy: the bytes arrive as a view of wasm memory, which a later growth detaches
    if (font && font.length) diagramFont = font.slice();
    buildModule("diagrams/diagrams.js")
        .then(async (m) => {
            await m.setFont(diagramFont);
            const kind = m.kind(source);
            if (!kind) throw { code: "unsupported-diagram", message: "not a kind of diagram pele draws" };
            const { render } = await buildModule(`diagrams/${kind}.js`);
            return m.render(render, source, JSON.parse(themeJson), maxWidth, dpr);
        })
        .then((r) => done(key, r.width, r.height, r.cssWidth, r.cssHeight, r.rgba, ""))
        // pele's own errors carry a code (syntax, semantic, unsupported-diagram, limit), and a
        // module that didn't load is "load"; anything else went wrong drawing it
        .catch((e) => done(key, 0, 0, 0, 0, new Uint8Array(0), `${(e && e.code) || "render"}: ${(e && e.message) || e}`));
}

// ---- safe areas: the notch, status bar and home indicator, which the canvas now draws under ----
let insets = null;
function measureInsets() {
    let probe = document.getElementById("safe-probe");
    if (!probe) {
        probe = document.createElement("div");
        probe.id = "safe-probe";
        probe.style.cssText =
            "position:absolute;visibility:hidden;pointer-events:none;left:0;top:0;width:0;height:0;" +
            "padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)";
        document.documentElement.appendChild(probe);
    }
    const cs = getComputedStyle(probe);
    insets = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map((v) => parseFloat(v) || 0);
    // the canvas reaches under the browser's own toolbars; what they cover at the bottom is
    // kept clear like the home indicator
    const canvas = document.querySelector("canvas");
    if (canvas) {
        const covered = canvas.getBoundingClientRect().bottom - window.innerHeight;
        if (covered > 0) insets[2] = Math.max(insets[2], covered);
    }
}
addEventListener("resize", () => (insets = null));
addEventListener("orientationchange", () => (insets = null));
// the toolbars collapsing and returning change what's free, without a window resize
window.visualViewport?.addEventListener("resize", () => (insets = null));

/** [top, right, bottom, left] css px of screen the system keeps for itself. */
export function safeInsets() {
    if (!insets) measureInsets();
    return new Float32Array(insets);
}

// ---- embeds: web components laid over the canvas (src/dom_embed.rs) ----
const embeds = new Map(); // key -> { host, el }
let embedHeightCb = null;

export function embedHeights(cb) {
    embedHeightCb = cb;
    // the site's own sans for them, by a name a face installed on the device can't shadow
    const faces = document.createElement("style");
    faces.textContent =
        `@font-face{font-family:site-sans;src:url(/fonts-v1/Inter.ttf);font-weight:100 900;font-style:normal}` +
        `@font-face{font-family:site-sans;src:url(/fonts-v1/Inter-Italic.ttf);font-weight:100 900;font-style:italic}`;
    document.head.appendChild(faces);
    // a component scrolling itself into view (a #fragment it opens) scrolls the document under
    // the canvas; the document stays put and the page scrolls by as much instead
    addEventListener("scroll", () => {
        const dx = scrollX, dy = scrollY;
        if (!dx && !dy) return;
        scrollTo(0, 0);
        scrollPageBy(dx, dy);
    }, { passive: true });
}

/** Scroll the page on the canvas by css px, as a wheel would. */
function scrollPageBy(dx, dy) {
    const canvas = document.querySelector("canvas");
    canvas?.dispatchEvent(new WheelEvent("wheel", { deltaX: dx, deltaY: dy, deltaMode: 0, clientX: innerWidth / 2, clientY: innerHeight / 2, bubbles: true, cancelable: true }));
}

function embedAttrs(el, attrsJson) {
    // never an inline handler: a post's props are text, not script
    for (const [k, v] of JSON.parse(attrsJson)) if (!/^on/i.test(k)) el.setAttribute(k, v);
}

/** Import `e`'s module and put its element in its host; one that never loads is tried again
 *  once the network may be back. */
function embedLoad(key, e) {
    e.failed = false;
    buildModule(e.module).then(() => {
        if (embeds.get(key) !== e) return;
        const el = document.createElement(e.tag);
        // the document never scrolls (the page is on the canvas), so a component bringing itself
        // into view (ff-tuner's pager) moves the canvas instead, up as well as down
        el.scrollIntoView = () => scrollPageBy(0, el.getBoundingClientRect().top - (insets?.[0] ?? 0));
        embedAttrs(el, e.attrs);
        el.style.display = "block";
        e.host.appendChild(el);
        e.el = el;
        // hidden by visibility, it still lays out: the column keeps room for its real height
        // (0 until it has content: the room set aside for it stays until then)
        new ResizeObserver(() => {
            const h = e.host.getBoundingClientRect().height;
            if (h > 0 && embedHeightCb) embedHeightCb(key, h);
        }).observe(e.host);
    }).catch((err) => {
        e.failed = true;
        console.warn("embed", e.module, err);
    });
}
onReconnect(() => {
    for (const [key, e] of embeds) if (e.failed) embedLoad(key, e);
});

export function embedPlace(key, tag, module, attrsJson, style, x, y, w, t, r, b, l, shown) {
    let e = embeds.get(key);
    if (!e) {
        const host = document.createElement("div");
        host.style.cssText = "position:absolute;left:0;top:0;z-index:2;will-change:transform;touch-action:none;";
        // scrolling over the component scrolls the page, which lives on the canvas
        host.addEventListener(
            "wheel",
            (ev) => {
                const canvas = document.querySelector("canvas");
                if (!canvas) return;
                ev.preventDefault();
                canvas.dispatchEvent(new WheelEvent("wheel", ev));
            },
            { passive: false },
        );
        // and a finger dragged over it scrolls the page too (gpui reads touch pointers on the
        // canvas); the component still gets them, so its own taps and controls work
        for (const type of ["pointerdown", "pointermove", "pointerup", "pointercancel"]) {
            host.addEventListener(
                type,
                (ev) => {
                    if (ev.pointerType !== "touch" || ev.forwarded) return;
                    const canvas = document.querySelector("canvas");
                    if (!canvas) return;
                    const copy = new PointerEvent(type, ev);
                    copy.forwarded = true;
                    canvas.dispatchEvent(copy);
                },
                { capture: true, passive: true },
            );
        }
        document.body.appendChild(host);
        e = { host, el: null, attrs: attrsJson, tag, module, failed: false };
        embeds.set(key, e);
        embedLoad(key, e);
    }
    if (e.attrs !== attrsJson) {
        e.attrs = attrsJson;
        if (e.el) embedAttrs(e.el, attrsJson);
    }
    if (e.style !== style) {
        e.host.style.cssText = `position:absolute;left:0;top:0;z-index:2;will-change:transform;touch-action:none;${style}`;
        e.style = style;
    }
    const s = e.host.style;
    s.visibility = shown ? "visible" : "hidden";
    s.transform = `translate3d(${x}px,${y}px,0)`;
    s.width = `${w}px`;
    s.clipPath = `inset(${t}px ${r}px ${b}px ${l}px)`;
}

export function embedHide(key) {
    const e = embeds.get(key);
    if (e) e.host.style.visibility = "hidden";
}

export function embedRemove(key) {
    const e = embeds.get(key);
    if (e) {
        e.host.remove();
        embeds.delete(key);
    }
}

// ---- "Find a title": a real <input> over the canvas (src/dom_input.rs) ----
let find = null;
let findCb = null;
const FIND_BASE =
    "position:absolute;left:0;top:0;z-index:3;margin:0;padding:0 14px;border:0;outline:none;" +
    "background:transparent;box-sizing:border-box;-webkit-appearance:none;appearance:none;";

export function findEvents(cb) {
    findCb = cb;
}

function findInput() {
    if (find) return find;
    find = document.createElement("input");
    find.type = "search";
    find.setAttribute("aria-label", "Find a title");
    find.autocomplete = "off";
    find.spellcheck = false;
    find.enterKeyHint = "search";
    // hidden is transparent and click-through, not visibility:hidden: a hidden element can't take
    // focus, and the tap that opens Find focuses it before its first placement
    find.style.cssText = FIND_BASE + "opacity:0;pointer-events:none;";
    find.addEventListener("input", () => findCb && findCb("text", find.value));
    find.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.isComposing) {
            e.preventDefault();
            findCb && findCb("submit", find.value);
        } else if (e.key === "Escape") {
            e.preventDefault();
            findCb && findCb("escape", find.value);
        }
    });
    document.body.appendChild(find);
    return find;
}

export function findPlace(x, y, w, h, t, r, b, l, value, placeholder, maxLen, style) {
    const el = findInput();
    if (el.dataset.style !== style) {
        const keep = { opacity: el.style.opacity, pointerEvents: el.style.pointerEvents };
        el.style.cssText = FIND_BASE + style;
        Object.assign(el.style, keep);
        el.dataset.style = style;
    }
    // the input holds the text being typed; the site only ever changes it by clearing it (after
    // a search, or Escape), so that's the one value written back
    if (value === "" && el.value !== "") el.value = "";
    el.placeholder = placeholder;
    el.maxLength = maxLen;
    const s = el.style;
    s.opacity = "1";
    s.pointerEvents = "auto";
    s.transform = `translate3d(${x}px,${y}px,0)`;
    s.width = `${w}px`;
    s.height = `${h}px`;
    s.clipPath = `inset(${t}px ${r}px ${b}px ${l}px)`;
}

export function findFocus() {
    const el = findInput();
    // A phone raises its keyboard only for focus given inside the tap, but focusing here, inside
    // gpui's own handling of it, blurs gpui's hidden textarea and re-enters gpui mid-dispatch. A
    // microtask runs the moment gpui's listener returns, still within the same browser event.
    queueMicrotask(() => el.focus({ preventScroll: true }));
}

export function findFocused() {
    return !!find && document.activeElement === find;
}

export function findHide() {
    if (!find) return;
    find.style.opacity = "0";
    find.style.pointerEvents = "none";
    if (document.activeElement === find) {
        find.blur();
        // gpui hears keys only through its hidden textarea: hand it the focus back, so "/" and
        // Escape keep working without a click on the canvas first. This runs inside gpui's render,
        // so the focus waits for a microtask as in findFocus.
        queueMicrotask(() => document.querySelector("body > textarea")?.focus({ preventScroll: true }));
    }
}
