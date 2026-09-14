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
    target.scrollIntoView({ behavior, block: "start" });
    return true;
}

function freshSeed(): number {
    return (Math.random() * 0x100000000) >>> 0;
}

function mountTiles(): void {
    for (const el of document.querySelectorAll<HTMLElement>(
        "[data-azulejo-tile]",
    )) {
        if (el.dataset.azulejoMounted !== undefined) continue;
        el.dataset.azulejoMounted = "";
        const redeal = mountAzulejoTile(el, {
            size: Number(el.dataset.azulejoSize) || 22,
            alt: el.dataset.azulejoAlt ?? "",
        });
        if (!redeal) continue;
        const paint = (seed: number) => {
            el.dataset.azulejoSeed = String(seed);
            redeal(seed);
        };
        paint(freshSeed());
        el.addEventListener("click", () => paint(freshSeed()));
    }
}

function init(): void {
    mountTiles();
    if (!active()) return;
    restoreScrolls();
    trackScrolls();
    revealHash("auto");

    addEventListener("hashchange", () => {
        if (active()) revealHash("smooth");
    });
}

if (document.readyState === "loading") {
    addEventListener("DOMContentLoaded", init, { once: true });
} else {
    init();
}
