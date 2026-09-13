import { mountAzulejoTile } from "@src/scripts/azulejo-tile";

const DECK_QUERY = "(min-width: 1200px)";
const STORE_PREFIX = "deck:";

function active(): boolean {
    return window.matchMedia(DECK_QUERY).matches;
}

function storeKey(col: string): string {
    return `${STORE_PREFIX}${location.pathname}:${col}`;
}

function readScroll(col: string): number {
    try {
        const raw = sessionStorage.getItem(storeKey(col));
        const n = raw === null ? NaN : Number(raw);
        return Number.isFinite(n) ? n : 0;
    } catch {
        return 0;
    }
}

function writeScroll(col: string, top: number): void {
    try {
        if (top <= 0) sessionStorage.removeItem(storeKey(col));
        else sessionStorage.setItem(storeKey(col), String(Math.round(top)));
    } catch {}
}

function panes(): HTMLElement[] {
    return Array.from(
        document.querySelectorAll<HTMLElement>("[data-deck-scroll]"),
    );
}

function columnOf(node: Element): HTMLElement | null {
    return node.closest<HTMLElement>("[data-deck-col]");
}

function focusColumn(id: string, behavior: ScrollBehavior): boolean {
    const root = document.querySelector<HTMLElement>("[data-deck-root]");
    const col = document.querySelector<HTMLElement>(
        `[data-deck-col="${CSS.escape(id)}"]`,
    );
    if (!root || !col) return false;
    const rail = root.querySelector<HTMLElement>(".deck-col--rail");
    const inset = rail && rail !== col ? rail.offsetWidth : 0;
    root.scrollTo({ left: Math.max(0, col.offsetLeft - inset), behavior });
    return true;
}

function restoreScrolls(): void {
    for (const pane of panes()) {
        const id = pane.dataset.deckScroll;
        if (!id) continue;
        const top = readScroll(id);
        if (top > 0) pane.scrollTop = top;
    }
}

function trackScrolls(): void {
    let frame = 0;
    const pending = new Map<string, number>();
    const flush = () => {
        frame = 0;
        for (const [id, top] of pending) writeScroll(id, top);
        pending.clear();
    };
    for (const pane of panes()) {
        const id = pane.dataset.deckScroll;
        if (!id) continue;
        pane.addEventListener(
            "scroll",
            () => {
                pending.set(id, pane.scrollTop);
                if (!frame) frame = requestAnimationFrame(flush);
            },
            { passive: true },
        );
    }
    addEventListener("pagehide", flush);
}

function revealHash(behavior: ScrollBehavior): boolean {
    const raw = location.hash.slice(1);
    if (!raw) return false;
    let target: Element | null = null;
    try {
        target = document.getElementById(decodeURIComponent(raw));
    } catch {
        target = document.getElementById(raw);
    }
    if (!target) return false;
    const col = columnOf(target);
    if (col?.dataset.deckCol) focusColumn(col.dataset.deckCol, "auto");
    target.scrollIntoView({ behavior, block: "start" });
    return true;
}

function syncColumnParam(): void {
    const root = document.querySelector<HTMLElement>("[data-deck-root]");
    if (!root) return;
    let frame = 0;
    const update = () => {
        frame = 0;
        let nearest: { id: string; delta: number } | null = null;
        for (const col of root.querySelectorAll<HTMLElement>(
            "[data-deck-col]",
        )) {
            const id = col.dataset.deckCol;
            if (!id) continue;
            const delta = Math.abs(col.offsetLeft - root.scrollLeft);
            if (!nearest || delta < nearest.delta) nearest = { id, delta };
        }
        if (!nearest) return;
        const url = new URL(location.href);
        if (root.scrollLeft <= 4) url.searchParams.delete("col");
        else url.searchParams.set("col", nearest.id);
        if (url.href !== location.href) history.replaceState(null, "", url);
    };
    root.addEventListener(
        "scroll",
        () => {
            if (!frame) frame = requestAnimationFrame(update);
        },
        { passive: true },
    );
}


const HIDDEN_KEY = "deck:hidden";

function readHidden(): Set<string> {
    try {
        const raw = localStorage.getItem(HIDDEN_KEY);
        const list = raw ? (JSON.parse(raw) as unknown) : [];
        return new Set(Array.isArray(list) ? list.map(String) : []);
    } catch {
        return new Set();
    }
}

function writeHidden(ids: Set<string>): void {
    try {
        if (ids.size === 0) localStorage.removeItem(HIDDEN_KEY);
        else localStorage.setItem(HIDDEN_KEY, JSON.stringify([...ids]));
    } catch {}
}

function toggleableColumns(): HTMLElement[] {
    return Array.from(
        document.querySelectorAll<HTMLElement>(".deck-col--peek[data-deck-col]"),
    );
}

function applyHidden(ids: Set<string>): void {
    for (const col of toggleableColumns()) {
        const id = col.dataset.deckCol;
        col.hidden = !!id && ids.has(id);
    }
}

function renderControls(ids: Set<string>): void {
    const panel = document.querySelector<HTMLElement>(
        "[data-deck-controls-panel]",
    );
    if (!panel) return;
    panel.replaceChildren();
    for (const col of toggleableColumns()) {
        const id = col.dataset.deckCol;
        if (!id) continue;
        const label = document.createElement("label");
        const box = document.createElement("input");
        box.type = "checkbox";
        box.checked = !ids.has(id);
        box.addEventListener("change", () => {
            const next = readHidden();
            if (box.checked) next.delete(id);
            else next.add(id);
            writeHidden(next);
            applyHidden(next);
            if (box.checked) focusColumn(id, "smooth");
        });
        const text = document.createElement("span");
        text.textContent =
            col.querySelector(".deck-col__title")?.textContent?.trim() ?? id;
        label.append(box, text);
        panel.append(label);
    }
}

function wireColumnToggles(): void {
    const ids = readHidden();
    applyHidden(ids);
    renderControls(ids);

    for (const btn of document.querySelectorAll<HTMLElement>(
        "[data-deck-close]",
    )) {
        btn.addEventListener("click", () => {
            const id = btn.dataset.deckClose;
            if (!id) return;
            const next = readHidden();
            next.add(id);
            writeHidden(next);
            applyHidden(next);
            renderControls(next);
        });
    }
}

function mountTiles(): void {
    for (const el of document.querySelectorAll<HTMLElement>(
        "[data-azulejo-seed]",
    )) {
        if (el.dataset.azulejoMounted !== undefined) continue;
        el.dataset.azulejoMounted = "";
        const size = Number(el.dataset.azulejoSize) || 22;
        const alt = el.dataset.azulejoAlt ?? "";
        if (el.dataset.azulejoLive !== undefined) {
            mountAzulejoTile(el, { size, alt, refireOnClick: true });
        } else {
            mountAzulejoTile(el, { size, alt, seed: Number(el.dataset.azulejoSeed) });
        }
    }
}

function init(): void {
    if (!active()) return;
    mountTiles();
    wireColumnToggles();
    restoreScrolls();
    trackScrolls();
    syncColumnParam();

    if (!revealHash("auto")) {
        const wanted = new URLSearchParams(location.search).get("col");
        if (wanted) focusColumn(wanted, "auto");
    }

    addEventListener("hashchange", () => {
        if (active()) revealHash("smooth");
    });
}

if (document.readyState === "loading") {
    addEventListener("DOMContentLoaded", init, { once: true });
} else {
    init();
}
