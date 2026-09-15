import { mountAzulejoTile } from "@src/scripts/azulejo-tile";

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

if (document.readyState === "loading") {
    addEventListener("DOMContentLoaded", mountTiles, { once: true });
} else {
    mountTiles();
}
