export const CONTRACT = "0x29867a886F96e84196fa47DEe2Fb4a5853412C03";
export const EXPLORER = "https://sepolia.basescan.org";
export const HIDDEN_PAGES = new Set(["/test", "/posts/1546329600000-markdown-test"]);
const BLOBS = "https://blobs.farfield.systems/blobs/";

const HASH_RE = /^0x[0-9a-f]{64}$/i;

export function blobUrl(src) {
    return src.startsWith("blob://") ? BLOBS + src.slice("blob://".length) : src;
}

export function parseRecord(text) {
    return text
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line))
        .sort((a, b) => a.block - b.block || a.logIndex - b.logIndex);
}

export function tally(rows, type, key) {
    const byLabel = new Map();
    for (const row of rows) {
        if (row.type !== type) continue;
        const entry = byLabel.get(row[key]) ?? { label: row[key], count: 0, first: row.timestamp };
        entry.count++;
        byLabel.set(row[key], entry);
    }
    return [...byLabel.values()];
}

export function topPages(rows, limit = 5) {
    return rows
        .filter((row) => !HIDDEN_PAGES.has(row.label))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

export function topEvents(rows, limit = 3) {
    return [...rows].sort((a, b) => b.count - a.count).slice(0, limit);
}

export function summarize(rows) {
    const sessionIds = rows.filter((row) => row.type === "session").map((row) => row.session);
    return {
        sessionCount: sessionIds.length,
        sessionIds,
        span: [rows[0]?.timestamp, rows.at(-1)?.timestamp],
        pages: topPages(tally(rows, "pageview", "path")),
        events: topEvents(tally(rows, "event", "name")),
    };
}

export function monthYear(seconds) {
    return new Date(seconds * 1000).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export async function readAnalytics({ src, fetchImpl = fetch, retryDelays = [400, 1600] }) {
    if (!src) throw new Error("no record src");
    for (let attempt = 0; ; attempt++) {
        try {
            const res = await fetchImpl(blobUrl(src));
            if (!res.ok) throw new Error(`record answered ${res.status}`);
            return summarize(parseRecord(await res.text()));
        } catch (error) {
            const delay = retryDelays[attempt];
            if (delay === undefined) throw error;
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
}

function hashToNumbers(hash) {
    const clean = hash.replace("0x", "");
    return Array.from({ length: clean.length / 2 }, (_, i) => parseInt(clean.slice(i * 2, (i + 1) * 2), 16));
}

function fmt(n) {
    const r = Math.round(n * 1000) / 1000;
    return Object.is(r, -0) ? "0" : String(r);
}

function dot(x, y, size) {
    return `M ${fmt(x)},${fmt(y)} m ${fmt(-size)},0 a ${fmt(size)},${fmt(size)} 0 1,0 ${fmt(size * 2)},0 a ${fmt(size)},${fmt(size)} 0 1,0 ${fmt(-size * 2)},0`;
}

function patternData(hash) {
    const numbers = hashToNumbers(hash);

    const background = [];
    for (let x = 0; x < 24; x++) {
        for (let y = 0; y < 28; y++) {
            const offsetX = (numbers[(x + y) % numbers.length] / 255 - 0.5) * 4;
            const offsetY = (numbers[(x + y + 1) % numbers.length] / 255 - 0.5) * 4;
            const size = 0.15 + (numbers[(x * y) % numbers.length] / 255) * 0.2;
            background.push(dot((x / 24) * 120 + offsetX, (y / 28) * 140 + offsetY, size));
        }
    }

    const centers = [];
    const numRegions = 12 + (numbers[0] % 4);
    for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 6; y++) {
            const offsetX = (numbers[(x + y) % numbers.length] / 255 - 0.5) * 15;
            const offsetY = (numbers[(x + y + 1) % numbers.length] / 255 - 0.5) * 15;
            centers.push([20 + (x * 80) / 4 + offsetX, 20 + (y * 100) / 5 + offsetY]);
        }
    }
    for (let i = 0; i < numRegions - 30; i++) {
        const angle = (numbers[i] / 255) * Math.PI * 2;
        const distance = 20 + (numbers[i + 1] / 255) * 45;
        centers.push([60 + Math.cos(angle) * distance, 70 + Math.sin(angle) * distance]);
    }

    const cells = (center, regionIndex) => {
        const out = [];
        const spirals = 4 + (numbers[regionIndex] % 3);
        for (let s = 0; s < spirals; s++) {
            let angle = (numbers[(s * regionIndex) % numbers.length] / 255) * Math.PI * 2;
            let radius = 1;
            let count = 0;
            while (radius < 55 && count < 60) {
                const angleNoise = (numbers[(Math.floor(angle * 5) + s) % numbers.length] / 255 - 0.5) * 0.4;
                angle += 0.3 + angleNoise;
                radius += 1.2 + numbers[(s * count) % numbers.length] / 255;
                const size = 0.5 + (numbers[(count * s) % numbers.length] / 255) * 0.7;
                out.push(dot(center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius, size));
                count++;
            }
        }
        const scatter = 40 + (numbers[regionIndex] % 20);
        for (let i = 0; i < scatter; i++) {
            const angle = (numbers[(regionIndex * i) % numbers.length] / 255) * Math.PI * 2;
            const radius = (numbers[(regionIndex * i + 1) % numbers.length] / 255) * 55;
            const size = 0.3 + (numbers[(i * 3) % numbers.length] / 255) * 0.5;
            out.push(dot(center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius, size));
        }
        return out;
    };

    const turing = (center, regionIndex) => {
        const out = [];
        const lines = 15 + (numbers[regionIndex] % 10);
        for (let i = 0; i < lines; i++) {
            const points = [];
            let x = center[0] + (numbers[i] / 255 - 0.5) * 55;
            let y = center[1] + (numbers[i + 1] / 255 - 0.5) * 55;
            const segments = 20 + (numbers[(i * 2) % numbers.length] % 15);
            for (let j = 0; j < segments; j++) {
                points.push([x, y]);
                const turn = (numbers[(i * j) % numbers.length] / 255 - 0.5) * Math.PI * 1.8;
                const step = 2.5 + (numbers[(i * j + 1) % numbers.length] / 255) * 4;
                x += Math.cos(turn) * step;
                y += Math.sin(turn) * step;
            }
            if (points.length > 2) {
                out.push(
                    points.reduce((acc, point, idx) => {
                        if (idx === 0) return `M ${fmt(point[0])} ${fmt(point[1])}`;
                        if (idx % 2 !== 0) return acc;
                        const prev = points[idx - 1];
                        const cx = prev[0] + (numbers[(idx * regionIndex) % numbers.length] / 255 - 0.5) * 10;
                        const cy = prev[1] + (numbers[(idx * regionIndex + 1) % numbers.length] / 255 - 0.5) * 10;
                        return `${acc} Q ${fmt(cx)} ${fmt(cy)}, ${fmt(point[0])} ${fmt(point[1])}`;
                    }, ""),
                );
            }
        }
        return out;
    };

    return {
        background,
        patterns: centers.map((center, i) =>
            numbers[i] > 100
                ? { type: "cells", elements: cells(center, i) }
                : { type: "turing", elements: turing(center, i) },
        ),
    };
}

function palette(hash) {
    const numbers = hashToNumbers(hash);
    const colors = [];
    for (let i = 0; i < 4; i++) {
        colors.push({
            hue: (numbers[i * 3] / 255) * 360,
            saturation: 60 + (numbers[i * 3 + 1] / 255) * 40,
            lightness: 20 + (numbers[i * 3 + 2] / 255) * 65,
        });
    }
    colors.sort((a, b) => a.lightness - b.lightness);
    return colors.map((c) => `hsl(${fmt(c.hue)}, ${fmt(c.saturation)}%, ${fmt(c.lightness)}%)`);
}

export function artworkSvg(hash, clipId = "clip-bg") {
    const { background, patterns } = patternData(hash);
    const colors = palette(hash);
    let svg =
        `<svg viewBox="-10 -10 140 160" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style="display: block;">` +
        `<defs><clipPath id="${clipId}"><rect x="-10" y="-10" width="140" height="160"></rect></clipPath></defs>` +
        `<rect x="-10" y="-10" width="140" height="160" fill="${colors[0]}" opacity="0.15"></rect>` +
        `<g clip-path="url(#${clipId})">`;
    for (const d of background) svg += `<path d="${d}" fill="${colors[1]}" opacity="0.15"></path>`;
    patterns.forEach((pattern, i) => {
        const color = colors[1 + (i % (colors.length - 1))];
        for (const d of pattern.elements) {
            svg +=
                pattern.type === "cells"
                    ? `<path d="${d}" fill="${color}" opacity="0.95"></path>`
                    : `<path d="${d}" fill="none" stroke="${color}" stroke-width="0.4" opacity="0.9"></path>`;
        }
    });
    return `${svg}</g></svg>`;
}

const STYLE = `
:host{display:block;color:var(--color-fg,oklch(28.05% 0.034 262.78));--oa-muted:var(--color-muted,oklch(52.08% 0.0287 257.68));--oa-rule:var(--color-border,oklch(89.74% 0.0084 91.49));--oa-mono:var(--font-mono,ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace)}
@media (prefers-color-scheme:dark){:host{color:var(--color-fg,oklch(92.4% 0.0163 95.24));--oa-muted:var(--color-muted,oklch(66.28% 0.0283 266.5));--oa-rule:var(--color-border,oklch(31.41% 0.0321 267.17))}}
*{box-sizing:border-box}
.oa{display:flex;flex-direction:column;gap:1.25em;line-height:1.55}
td,summary{-webkit-hyphens:manual;hyphens:manual}
p,h3{margin:0}
h3{font:inherit;font-weight:600}
.note{color:var(--oa-muted)}
button{align-self:flex-start;font:inherit;color:inherit;background:none;border:1px solid var(--oa-rule);border-radius:999px;padding:.25em .9em;cursor:pointer}
a{color:inherit;text-underline-offset:.2em}
table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
th,td{padding:.4em 0;text-align:left;border-bottom:1px solid var(--oa-rule);vertical-align:top}
th{font-weight:600}
th:last-child,td:last-child{text-align:right;padding-left:1em;white-space:nowrap}
td:first-child{overflow-wrap:anywhere}
ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
li{border-bottom:1px solid var(--oa-rule)}
summary{cursor:pointer;padding:.45em 0;font-family:var(--oa-mono);font-size:.8125em;word-break:break-all;color:var(--oa-muted);list-style:none}
summary::-webkit-details-marker{display:none}
summary::before{content:"▸";display:inline-block;width:1.4em}
details[open]>summary::before{content:"▾"}
details[open]>summary,summary:hover{color:inherit}
summary:focus-visible{outline:2px solid currentColor;outline-offset:2px}
figure{margin:0 0 1em;display:flex;justify-content:center}
figure svg{width:100%;max-width:600px;height:auto;aspect-ratio:7/8}
`;

function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    for (const child of children) node.append(child);
    return node;
}

function tallyTable(heading, unit, rows) {
    return el(
        "table",
        {},
        el("thead", {}, el("tr", {}, el("th", {}, heading), el("th", {}, unit))),
        el("tbody", {}, ...rows.map((row) => el("tr", {}, el("td", {}, row.label), el("td", {}, String(row.count))))),
    );
}

function contractLink(contract) {
    return el("a", { href: `${EXPLORER}/address/${contract}#code`, rel: "noopener" }, "the contract on Basescan");
}

function sessionList(ids) {
    return el(
        "ol",
        {},
        ...ids.map((hash, i) => {
            const details = el("details", { id: hash }, el("summary", {}, hash));
            details.addEventListener("toggle", () => {
                if (details.open && !details.querySelector("figure")) {
                    const figure = el("figure", { "aria-label": `Portrait for session ${hash.slice(0, 10)}` });
                    figure.innerHTML = artworkSvg(hash, `oa-clip-${i}`);
                    details.append(figure);
                }
                const fragment = `#${hash}`;
                if (details.open && location.hash !== fragment) {
                    history.replaceState(history.state, "", fragment);
                } else if (!details.open && location.hash === fragment) {
                    history.replaceState(history.state, "", location.pathname + location.search);
                }
            });
            return el("li", {}, details);
        }),
    );
}

const ElementBase = typeof HTMLElement === "undefined" ? class {} : HTMLElement;

export class OnchainAnalyticsElement extends ElementBase {
    connectedCallback() {
        if (this.shadowRoot) return;
        const root = this.attachShadow({ mode: "open" });
        const style = el("style");
        style.textContent = STYLE;
        const body = el("div", { class: "oa", "aria-live": "polite" });
        root.append(style, body);
        this.#read(body);
    }

    #read(body) {
        body.replaceChildren(el("p", { class: "note" }, "Loading the record…"));
        readAnalytics({ src: this.getAttribute("src") ?? "" }).then(
            (data) => this.#show(body, data),
            () => {
                const retry = el("button", { type: "button" }, "Try again");
                retry.addEventListener("click", () => this.#read(body));
                body.replaceChildren(el("p", { class: "note" }, "The record didn't load. Every entry is still in ", contractLink(CONTRACT), ". "), retry);
            },
        );
    }

    #show(body, data) {
        body.replaceChildren(
            el("p", {}, `${data.sessionCount} unique sessions were recorded between ${monthYear(data.span[0])} and ${monthYear(data.span[1])}.`),
            el(
                "p",
                { class: "note" },
                el("a", { href: blobUrl(this.getAttribute("src") ?? ""), rel: "noopener" }, "Download every session, page view and event as JSONL"),
                ".",
            ),
            tallyTable("Top 5 pages", "Views", data.pages),
            tallyTable("Top events", "Count", data.events),
            el("h3", {}, "Session hashes"),
            el(
                "p",
                {},
                "The keccak256 hashes generated are technically valid private keys. These private keys are effectively burned, since they are public. As such, they should never be used for anything.",
            ),
            el("p", { class: "note" }, "Open a hash to see its portrait."),
            sessionList(data.sessionIds),
        );
        const wanted = decodeURIComponent(location.hash.slice(1));
        if (HASH_RE.test(wanted)) {
            const target = body.querySelector(`details[id="${wanted.toLowerCase()}"]`);
            if (target) {
                target.open = true;
                requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
            }
        }
    }
}

if (typeof customElements !== "undefined" && !customElements.get("ff-onchain-analytics")) {
    customElements.define("ff-onchain-analytics", OnchainAnalyticsElement);
}
