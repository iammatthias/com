

import { mulberry32 } from "@components/AzulejoTile/recipe";

function pick<T>(rnd: () => number, items: readonly T[]): T {
    return items[Math.floor(rnd() * items.length)];
}

const NARROW = new Set("IJLijl1");
const WIDE = new Set("MWmw");
const ROUND = new Set("OQCGDoqcgd0");

interface LetterFit {
    sizeEm: number;
    fieldR: number;
}

function fitFor(letter: string): LetterFit {
    if (NARROW.has(letter)) return { sizeEm: 2.9, fieldR: 24 };
    if (WIDE.has(letter)) return { sizeEm: 2.2, fieldR: 30 };
    if (ROUND.has(letter)) return { sizeEm: 2.55, fieldR: 28 };
    return { sizeEm: 2.6, fieldR: 27 };
}

const S = 96;

type EdgeMotif = "plain" | "zigzag" | "dots" | "dashes";
type CornerMotif = "canto" | "diamond" | "dots" | "step";
type FieldShape = "none" | "circle" | "diamond" | "octagon";

function zigzagEdge(inset: number, amp: number): string {
    const step = (S - inset * 2) / 8;
    const sides: string[] = [];
    for (const [sx, sy, dx, dy, nx, ny] of [
        [inset, inset, 1, 0, 0, 1],
        [inset, S - inset, 1, 0, 0, -1],
        [inset, inset, 0, 1, 1, 0],
        [S - inset, inset, 0, 1, -1, 0],
    ] as const) {
        const pts: string[] = [];
        for (let i = 0; i <= 8; i++) {
            const along = i * step;
            const out = i % 2 === 1 ? amp : 0;
            pts.push(
                `${(sx + dx * along + nx * out).toFixed(1)},${(sy + dy * along + ny * out).toFixed(1)}`,
            );
        }
        sides.push(
            `<polyline points="${pts.join(" ")}" fill="none" stroke="var(--cap-wash)" stroke-width="0.8"/>`,
        );
    }
    return sides.join("");
}

function dotsEdge(inset: number): string {
    const step = (S - inset * 2) / 6;
    const dots: string[] = [];
    for (let i = 1; i < 6; i++) {
        const a = inset + i * step;
        for (const [x, y] of [
            [a, inset],
            [a, S - inset],
            [inset, a],
            [S - inset, a],
        ]) {
            dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.1" fill="var(--cap-wash)"/>`);
        }
    }
    return dots.join("");
}

function edge(motif: EdgeMotif, inset: number): string {
    switch (motif) {
        case "zigzag":
            return zigzagEdge(inset, 2.6);
        case "dots":
            return dotsEdge(inset);
        case "dashes":
            return `<rect x="${inset}" y="${inset}" width="${S - inset * 2}" height="${S - inset * 2}" fill="none" stroke="var(--cap-wash)" stroke-width="1" stroke-dasharray="4 3"/>`;
        case "plain":
            return "";
    }
}

function corners(motif: CornerMotif, inset: number): string {
    const c: string[] = [];
    const pos: Array<[number, number, number, number]> = [
        [inset, inset, 1, 1],
        [S - inset, inset, -1, 1],
        [inset, S - inset, 1, -1],
        [S - inset, S - inset, -1, -1],
    ];
    for (const [x, y, dx, dy] of pos) {
        switch (motif) {
            case "canto":
                c.push(
                    `<path d="M ${x + dx * 9} ${y} A 9 9 0 0 ${dx * dy > 0 ? 1 : 0} ${x} ${y + dy * 9}" fill="none" stroke="var(--cap-accent2)" stroke-width="1.4"/>`,
                );
                break;
            case "diamond": {
                const cx = x + dx * 5.5;
                const cy = y + dy * 5.5;
                c.push(
                    `<path d="M ${cx} ${cy - 3.4} L ${cx + 3.4} ${cy} L ${cx} ${cy + 3.4} L ${cx - 3.4} ${cy} Z" fill="var(--cap-accent2)"/>`,
                );
                break;
            }
            case "dots": {
                const cx = x + dx * 5;
                const cy = y + dy * 5;
                c.push(
                    `<circle cx="${cx}" cy="${cy}" r="1.6" fill="var(--cap-accent2)"/>`,
                    `<circle cx="${cx + dx * 4.5}" cy="${cy}" r="1" fill="var(--cap-accent2)"/>`,
                    `<circle cx="${cx}" cy="${cy + dy * 4.5}" r="1" fill="var(--cap-accent2)"/>`,
                );
                break;
            }
            case "step":
                c.push(
                    `<path d="M ${x + dx * 8} ${y} L ${x + dx * 8} ${y + dy * 4} L ${x + dx * 4} ${y + dy * 4} L ${x + dx * 4} ${y + dy * 8} L ${x} ${y + dy * 8}" fill="none" stroke="var(--cap-accent2)" stroke-width="1.2"/>`,
                );
                break;
        }
    }
    return c.join("");
}

function field(shape: FieldShape, r: number): string {
    const m = S / 2;
    switch (shape) {
        case "circle":
            return `<circle cx="${m}" cy="${m}" r="${r}" fill="none" stroke="var(--cap-wash)" stroke-width="0.9"/>`;
        case "diamond":
            return `<path d="M ${m} ${m - r} L ${m + r} ${m} L ${m} ${m + r} L ${m - r} ${m} Z" fill="none" stroke="var(--cap-wash)" stroke-width="0.9"/>`;
        case "octagon": {
            const k = r * 0.4142;
            return `<path d="M ${m - k} ${m - r} L ${m + k} ${m - r} L ${m + r} ${m - k} L ${m + r} ${m + k} L ${m + k} ${m + r} L ${m - k} ${m + r} L ${m - r} ${m + k} L ${m - r} ${m - k} Z" fill="none" stroke="var(--cap-wash)" stroke-width="0.9"/>`;
        }
        case "none":
            return "";
    }
}

function ribbons(innerInset: number, r: number): string {
    const m = S / 2;
    const stop = (r + 4) / Math.SQRT2;
    const lines: string[] = [];
    for (const [dx, dy] of [
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
    ] as const) {
        lines.push(
            `<line x1="${m + dx * (m - innerInset)}" y1="${m + dy * (m - innerInset)}" x2="${(m + dx * stop).toFixed(1)}" y2="${(m + dy * stop).toFixed(1)}" stroke="var(--cap-wash)" stroke-width="1.1"/>`,
        );
    }
    return lines.join("");
}

const POLYCHROME = ["laurel", "ochre", "plum", "terracotta"] as const;

export function azulejoCapHtml(letter: string, seed: number): string {
    if (!/^[A-Za-z0-9]$/.test(letter)) return "";
    const rnd = mulberry32(seed);
    const { sizeEm, fieldR } = fitFor(letter);

    const edgeMotif = pick(rnd, ["plain", "zigzag", "dots", "dashes"] as const);
    const cornerMotif = pick(rnd, ["canto", "diamond", "dots", "step"] as const);
    const fieldShape = pick(rnd, ["circle", "diamond", "octagon", "none"] as const);
    const withRibbons = fieldShape !== "none" && rnd() < 0.45;
    const hue = rnd() < 0.35 ? pick(rnd, POLYCHROME) : null;
    const frameW = 1.4 + rnd() * 0.9;

    const outerInset = 3;
    const innerInset = 11 + Math.round(rnd() * 2);

    const svg =
        `<svg class="azulejo-cap__tile" viewBox="0 0 ${S} ${S}" aria-hidden="true" focusable="false">` +
        `<rect x="0" y="0" width="${S}" height="${S}" fill="var(--cap-ground)"/>` +
        `<rect x="${outerInset}" y="${outerInset}" width="${S - outerInset * 2}" height="${S - outerInset * 2}" fill="none" stroke="var(--cap-line)" stroke-width="${frameW.toFixed(2)}"/>` +
        `<rect x="${innerInset}" y="${innerInset}" width="${S - innerInset * 2}" height="${S - innerInset * 2}" fill="none" stroke="var(--cap-wash)" stroke-width="0.75"/>` +
        edge(edgeMotif, (outerInset + innerInset) / 2) +
        (withRibbons ? ribbons(innerInset, fieldR) : "") +
        field(fieldShape, fieldR) +
        corners(cornerMotif, outerInset) +
        `</svg>`;

    const hueClass = hue ? ` azulejo-cap--${hue}` : "";
    return (
        `<span class="azulejo-cap${hueClass}">` +
        svg +
        `<span class="azulejo-cap__letter" style="font-size:${sizeEm}em">${letter}</span>` +
        `</span>`
    );
}

const LEAD_BLOCKS_RE =
    /^(?:\s*(?:<figure class="doc-figure"[\s\S]*?<\/figure>|<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>|<p>(?:\s*<a\b[^>]*>[^<]*<\/a>\s*)+<\/p>))*/;

const OPENING_LETTER_RE =
    /^(\s*<p>(?:<(?:a|em|strong)\b[^>]*>)*)([A-Za-z0-9])/;

export function withLettrine(bodyHtml: string, seed: number): string {
    const lead = bodyHtml.match(LEAD_BLOCKS_RE)?.[0] ?? "";
    const rest = bodyHtml.slice(lead.length);
    const m = rest.match(OPENING_LETTER_RE);
    if (!m) return bodyHtml;
    const tile = azulejoCapHtml(m[2], seed);
    if (!tile) return bodyHtml;
    return (
        lead +
        m[1] +
        tile +
        rest.slice(m[1].length + m[2].length)
    );
}
