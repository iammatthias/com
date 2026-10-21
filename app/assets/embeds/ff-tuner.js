const CHAINS = {
    base: { name: "Base", explorer: "https://basescan.org" },
};
const KINDS = { 0: "ping", 1: "note", 2: "bootstrap", 3: "digest", 255: "opaque" };
const PAGE_SIZE = 5;
const BLOBS = "https://blobs.farfield.systems/blobs/";

export function fiveFigureGroups(cipher) {
    const hex = cipher.replace(/^0x/i, "").toLowerCase();
    if (!/^(?:[0-9a-f]{2})+$/.test(hex)) throw new Error("ciphertext must contain one or more whole bytes");
    let value = BigInt(`0x${hex}`);
    if (value === 0n) return ["00000"];
    const groups = [];
    while (value > 0n) {
        groups.push((value % 100_000n).toString(10).padStart(5, "0"));
        value /= 100_000n;
    }
    return groups.reverse();
}

export function parseRecording(text) {
    return text
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line))
        .sort((a, b) => a.seq - b.seq);
}

export function blobUrl(src) {
    return src.startsWith("blob://") ? BLOBS + src.slice("blob://".length) : src;
}

export async function readRecording({ src, fetchImpl = fetch, retryDelays = [400, 1600] }) {
    if (!src) throw new Error("no recording src");
    for (let attempt = 0; ; attempt++) {
        try {
            const res = await fetchImpl(blobUrl(src));
            if (!res.ok) throw new Error(`recording answered ${res.status}`);
            return parseRecording(await res.text());
        } catch (error) {
            const delay = retryDelays[attempt];
            if (delay === undefined) throw error;
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
}

export function summarize(transmissions) {
    const counts = new Map();
    for (const t of transmissions) {
        const label = KINDS[t.kind] ?? `kind ${t.kind}`;
        counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return {
        count: transmissions.length,
        firstBlock: transmissions[0]?.block,
        lastBlock: transmissions.at(-1)?.block,
        kinds: [...counts].sort((a, b) => b[1] - a[1]),
    };
}

function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    for (const child of children) node.append(child);
    return node;
}

function link(href, text) {
    return el("a", { href, rel: "noopener" }, text);
}

const plural = (n, word) => `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "s"}`;

const STYLE = `
:host{display:block;color:var(--color-fg,oklch(28.05% 0.034 262.78));--tn-muted:var(--color-muted,oklch(52.08% 0.0287 257.68));--tn-rule:var(--color-border,oklch(89.74% 0.0084 91.49));--tn-mono:var(--font-mono,ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace)}
@media (prefers-color-scheme:dark){:host{color:var(--color-fg,oklch(92.4% 0.0163 95.24));--tn-muted:var(--color-muted,oklch(66.28% 0.0283 266.5));--tn-rule:var(--color-border,oklch(31.41% 0.0321 267.17))}}
*{box-sizing:border-box}
.tn{display:flex;flex-direction:column;gap:1.25em;line-height:1.55}
p,ol{margin:0}
.note{color:var(--tn-muted)}
a{color:inherit;text-underline-offset:.2em}
ol{list-style:none;padding:0;display:flex;flex-direction:column;gap:1.25em}
li{display:flex;flex-direction:column;gap:.4em;padding-top:1em;border-top:1px solid var(--tn-rule)}
.meta{display:flex;flex-wrap:wrap;gap:.25em 1em;font-family:var(--tn-mono);font-size:.85em;color:var(--tn-muted)}
.seq{color:var(--color-fg,currentColor);font-weight:600}
.groups{font-family:var(--tn-mono);font-size:.85em;word-spacing:.35em;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}
.pager{display:flex;flex-wrap:wrap;align-items:center;gap:.75em}
.pager span{color:var(--tn-muted);font-variant-numeric:tabular-nums}
button{font:inherit;color:inherit;background:none;border:1px solid var(--tn-rule);border-radius:999px;padding:.25em .9em;cursor:pointer;align-self:flex-start}
button:disabled{opacity:.4;cursor:default}
`;

export class TunerElement extends (typeof HTMLElement === "undefined" ? class {} : HTMLElement) {
    #body;
    #transmissions = [];
    #summary;
    #page = 0;

    connectedCallback() {
        if (this.shadowRoot) return;
        const root = this.attachShadow({ mode: "open" });
        const style = el("style");
        style.textContent = STYLE;
        this.#body = el("div", { class: "tn", "aria-live": "polite" });
        root.append(style, this.#body);
        this.#body.append(el("p", { class: "note" }, "Loading the recording…"));
        const observer = new IntersectionObserver((entries) => {
            if (!entries.some((e) => e.isIntersecting)) return;
            observer.disconnect();
            this.#read();
        }, { rootMargin: "600px" });
        observer.observe(this);
    }

    get #chain() {
        return CHAINS[this.getAttribute("chain")] ?? CHAINS.base;
    }

    #read() {
        const src = this.getAttribute("src") ?? "";
        this.#body.replaceChildren(el("p", { class: "note" }, "Loading the recording…"));
        readRecording({ src }).then(
            (transmissions) => {
                this.#transmissions = transmissions;
                this.#summary = summarize(transmissions);
                this.#render();
            },
            () => {
                const retry = el("button", { type: "button" }, "Try again");
                retry.addEventListener("click", () => this.#read());
                this.#body.replaceChildren(
                    el("p", { class: "note" }, "The recording didn't load. ", link(blobUrl(src), "Download it as JSONL"), " instead. "),
                    retry,
                );
            },
        );
    }

    #render() {
        const station = this.getAttribute("station") ?? "";
        const { explorer, name } = this.#chain;
        const summary = this.#summary;
        const pages = Math.ceil(summary.count / PAGE_SIZE);
        const start = this.#page * PAGE_SIZE;
        const shown = this.#transmissions.slice(start, start + PAGE_SIZE);

        const pager = () => {
            const earlier = el("button", { type: "button" }, "Earlier");
            const later = el("button", { type: "button" }, "Later");
            if (this.#page === 0) earlier.disabled = true;
            if (this.#page >= pages - 1) later.disabled = true;
            earlier.addEventListener("click", () => this.#go(this.#page - 1));
            later.addEventListener("click", () => this.#go(this.#page + 1));
            return el(
                "div",
                { class: "pager" },
                earlier,
                later,
                el("span", {}, `${(start + 1).toLocaleString("en-US")}–${(start + shown.length).toLocaleString("en-US")} of ${summary.count.toLocaleString("en-US")}`),
            );
        };

        this.#body.replaceChildren(
            el(
                "div",
                { class: "meta" },
                el("span", { class: "seq" }, `Station ${this.getAttribute("station-id") ?? ""} · ${name}`),
                link(`${explorer}/address/${station}`, `${station.slice(0, 6)}…${station.slice(-4)}`),
                el("span", {}, `blocks ${summary.firstBlock.toLocaleString("en-US")}–${summary.lastBlock.toLocaleString("en-US")}`),
                el("span", {}, summary.kinds.map(([label, n]) => plural(n, label)).join(", ")),
            ),
            el("p", { class: "note" }, `${plural(summary.count, "transmission")}, each as it was heard, in five-figure groups. `, link(blobUrl(this.getAttribute("src") ?? ""), "Download the recording as JSONL"), "."),
            pager(),
            el(
                "ol",
                { start: String(start + 1) },
                ...shown.map((t) =>
                    el(
                        "li",
                        { id: `seq-${t.seq}` },
                        el(
                            "div",
                            { class: "meta" },
                            el("a", { class: "seq", href: `${explorer}/tx/${t.tx}`, rel: "noopener" }, String(t.seq).padStart(6, "0")),
                            el("span", {}, KINDS[t.kind] ?? `kind ${t.kind}`),
                            link(`${explorer}/block/${t.block}`, `block ${t.block.toLocaleString("en-US")}`),
                        ),
                        el("p", { class: "groups" }, fiveFigureGroups(t.cipher).join(" ")),
                    ),
                ),
            ),
            pager(),
        );
    }

    #go(page) {
        this.#page = page;
        this.#render();
        this.scrollIntoView({ block: "start" });
    }
}

if (typeof customElements !== "undefined" && !customElements.get("ff-tuner")) {
    customElements.define("ff-tuner", TunerElement);
}
