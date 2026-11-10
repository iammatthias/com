const BUILD = new URL("../../../", import.meta.url);
export function buildUrl(path) {
    return new URL(path, BUILD).href;
}

export function onReconnect(f) {
    addEventListener("online", f);
    document.addEventListener("visibilitychange", () => document.hidden || f());
}

const buildModules = new Map();
const buildModuleTries = new Map();
const MODULE_RETRY_MS = [400, 1600];

let buildGoneChecked = false;
async function reloadIfBuildGone(url) {
    if (buildGoneChecked || !/^\/b\/[0-9a-f]{16}\//.test(new URL(url).pathname)) return;
    buildGoneChecked = true;
    try {
        if (sessionStorage.getItem("burin.gone")) return;
        if ((await fetch(url, { method: "HEAD", cache: "no-store" })).status !== 404) return;
        sessionStorage.setItem("burin.gone", "1");
        await (await fetch(location.href, { cache: "reload" })).arrayBuffer();
    } catch {
        return;
    }
    location.reload();
}

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
                if (attempt >= MODULE_RETRY_MS.length) {
                    reloadIfBuildGone(buildUrl(path));
                    throw Object.assign(e instanceof Error ? e : new Error(String(e)), { code: "load" });
                }
                await new Promise((wake) => setTimeout(wake, MODULE_RETRY_MS[attempt]));
            }
        }
    })();
    m.catch(() => buildModules.delete(path));
    buildModules.set(path, m);
    return m;
}

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
            if (new URL(`/${clean}`, location.origin).origin !== location.origin) return failure(`"${path}" isn't a path on this site.`);
            const res = await fetch(`/${clean}.md`, { method: "HEAD" });
            if (!res.ok) return failure(`No entry at "${clean}". Use search_site or list_content to find a valid path.`);
            history.pushState(null, "", `/${clean}`);
            dispatchEvent(new PopStateEvent("popstate"));
            return text(`Navigating to /${clean}.`);
        },
    });
}

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

function installTapThroughFling() {
    const SLOP = 8;
    const DECAY = 0.998;
    const STILL = 200;
    let fling = null;
    const down = new Map();
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

let diagramFont = null;

export function renderDiagram(key, source, themeJson, maxWidth, dpr, font, done) {
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
        .catch((e) => done(key, 0, 0, 0, 0, new Uint8Array(0), `${(e && e.code) || "render"}: ${(e && e.message) || e}`));
}

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
    const canvas = document.querySelector("canvas");
    if (canvas) {
        const covered = canvas.getBoundingClientRect().bottom - window.innerHeight;
        if (covered > 0) insets[2] = Math.max(insets[2], covered);
    }
}

export function safeInsets() {
    measureInsets();
    return new Float32Array(insets);
}

const embeds = new Map();
let embedHeightCb = null;

export function embedHeights(cb) {
    embedHeightCb = cb;
    const faces = document.createElement("style");
    faces.textContent =
        `@font-face{font-family:site-sans;src:url(/fonts-v1/Inter.ttf);font-weight:100 900;font-style:normal}` +
        `@font-face{font-family:site-sans;src:url(/fonts-v1/Inter-Italic.ttf);font-weight:100 900;font-style:italic}`;
    document.head.appendChild(faces);
    addEventListener("scroll", () => {
        const dx = scrollX, dy = scrollY;
        if (!dx && !dy) return;
        scrollTo(0, 0);
        scrollPageBy(dx, dy);
    }, { passive: true });
}

function scrollPageBy(dx, dy) {
    const canvas = document.querySelector("canvas");
    canvas?.dispatchEvent(new WheelEvent("wheel", { deltaX: dx, deltaY: dy, deltaMode: 0, clientX: innerWidth / 2, clientY: innerHeight / 2, bubbles: true, cancelable: true }));
}

function embedAttrs(el, attrsJson) {
    for (const [k, v] of JSON.parse(attrsJson)) if (!/^on/i.test(k)) el.setAttribute(k, v);
}

function embedLoad(key, e) {
    e.failed = false;
    buildModule(e.module).then(() => {
        if (embeds.get(key) !== e) return;
        const el = document.createElement(e.tag);
        el.scrollIntoView = () => scrollPageBy(0, el.getBoundingClientRect().top - (insets?.[0] ?? 0));
        embedAttrs(el, e.attrs);
        el.style.display = "block";
        e.host.appendChild(el);
        e.el = el;
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

export function findPlace(x, y, w, h, t, r, b, l, placeholder, maxLen, style) {
    const el = findInput();
    if (el.dataset.style !== style) {
        const keep = { opacity: el.style.opacity, pointerEvents: el.style.pointerEvents };
        el.style.cssText = FIND_BASE + style;
        Object.assign(el.style, keep);
        el.dataset.style = style;
    }
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
    queueMicrotask(() => el.focus({ preventScroll: true }));
}

export function findClear() {
    if (find) find.value = "";
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
        queueMicrotask(() => document.querySelector("body > textarea")?.focus({ preventScroll: true }));
    }
}
