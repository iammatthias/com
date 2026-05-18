// Date / time formatting helpers. Centralized so every list, card,
// dateline, etc. across the site renders the same way — locale,
// timezone, and month-style decisions live in one place.

/**
 * Short-form date: "May 14, 2026". Used on card datelines, list rows,
 * publication indexes — anywhere a compact reference to a publish date
 * is sufficient. UTC timezone keeps the rendered date stable across
 * client locales (we don't want the same post showing two different
 * days for visitors on either side of midnight UTC).
 */
export function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    });
}

/**
 * Long-form date: "May 14, 2026". Used on the doc detail page hero
 * dateline where a fuller spelling reads better at larger sizes.
 */
export function fmtDateLong(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    });
}

/**
 * FNV-1a 32-bit hash — deterministic, fast, dependency-free. Converts
 * any string (typically an at:// URI) into an unsigned integer seed
 * suitable for the mulberry32 PRNG used by the generative tile
 * components (AzulejoTile, TerrazzoBanner). Same input → same output,
 * forever — so each record carries a stable, unique-looking decoration.
 */
export function hashSeed(s: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}
