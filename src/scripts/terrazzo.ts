
import { mulberry32 } from "@components/AzulejoTile/recipe";

const PALETTES: Record<string, string[]> = {
    Bianco: ["#f1ece1", "#1a1a1a", "#8b3a2f", "#cb6a4f", "#5a5247", "#a6a097", "#d4c8a8"],
    Mint:   ["#e8f0e6", "#2d4a3e", "#5a8c7e", "#a8c8b8", "#f4a896", "#1a1a1a", "#d9c9a8"],
    Rose:   ["#f6e6e0", "#7a3a3a", "#d9847c", "#3a2a28", "#c9a89a", "#e8c9a8", "#a06864"],
    Carbon: ["#e8e6e2", "#1a1a1a", "#3a3a3a", "#6c6c6a", "#a0a09c", "#bcbab5"],
    Tropic: ["#f4ead8", "#2d6e3e", "#f2a83b", "#d94f3e", "#1a3a4a", "#8c5a3e", "#e8d9a8"],
    Ink:    ["#1a1a1a", "#f1ece1", "#cb6a4f", "#5a8c7e", "#d4c8a8", "#7a7a7a", "#3a3a3a"],
    Rosso:  ["#efe7d6", "#a82a1f", "#1a1a1a", "#e8a878", "#5a3a2a", "#d9c9a8"],
    Acqua:  ["#e6eef0", "#0e3a4a", "#3a8ca0", "#a8d0d8", "#1a1a1a", "#d9c9a8", "#cb6a4f"],
};

interface StylePreset {
    algo: "scatter" | "palladiana";
    density: number;
    minSize: number;
    maxSize: number;
    sides: number;
    chaos: number;
    sizeBias: number;
}

const STYLES: Record<string, StylePreset> = {
    Venetian:   { algo: "scatter",    density: 220, minSize: 6, maxSize: 80,  sides: 6, chaos: 55, sizeBias: 2.2 },
    Palladiana: { algo: "palladiana", density: 110, minSize: 4, maxSize: 130, sides: 6, chaos: 35, sizeBias: 2.5 },
    Micro:      { algo: "scatter",    density: 460, minSize: 3, maxSize: 18,  sides: 6, chaos: 50, sizeBias: 1.5 },
    Shards:     { algo: "scatter",    density: 200, minSize: 5, maxSize: 90,  sides: 4, chaos: 78, sizeBias: 2.0 },
    Pebble:     { algo: "scatter",    density: 130, minSize: 8, maxSize: 60,  sides: 9, chaos: 22, sizeBias: 1.8 },
};

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
    const n = parseInt(hex.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const srgbToLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
const linearToSrgb = (c: number) =>
    c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

function rgbToHsl([r, g, b]: RGB): RGB {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    const s = l <= 0.5 ? d / (max + min) : d / (2 - max - min);
    let h: number;
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return [h / 6, s, l];
}

function hue2rgb(p: number, q: number, t: number): number {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * 6 * (2 / 3 - t);
    return p;
}

function hslToRgb([h, s, l]: RGB): RGB {
    if (s === 0) return [l, l, l];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [
        hue2rgb(p, q, h + 1 / 3),
        hue2rgb(p, q, h),
        hue2rgb(p, q, h - 1 / 3),
    ];
}

function cssColor([r, g, b]: RGB): string {
    const to255 = (c: number) =>
        Math.max(0, Math.min(255, Math.round(linearToSrgb(c) * 255)));
    return `rgb(${to255(r)},${to255(g)},${to255(b)})`;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function jitterColor(hex: string, rng: () => number): string {
    const linear = hexToRgb(hex).map(srgbToLinear) as RGB;
    const hsl = rgbToHsl(linear);
    const h = (hsl[0] + (rng() - 0.5) * 0.025 + 1) % 1;
    const s = clamp01(hsl[1] + (rng() - 0.5) * 0.1);
    const l = clamp01(hsl[2] + (rng() - 0.5) * 0.07);
    return cssColor(hslToRgb([h, s, l]));
}

interface Pt {
    x: number;
    y: number;
}

function makeChipVerts(
    cx: number,
    cy: number,
    radius: number,
    vertexCount: number,
    irr: number,
    rng: () => number,
): Pt[] {
    const verts: Pt[] = [];
    const step = (Math.PI * 2) / vertexCount;
    const angOffset = rng() * Math.PI * 2;
    for (let i = 0; i < vertexCount; i++) {
        const baseAng = angOffset + i * step;
        const angle = baseAng + (rng() - 0.5) * step * irr * 0.7;
        const r = radius * (1 - irr * 0.45 + rng() * irr * 0.55);
        verts.push({
            x: cx + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r,
        });
    }
    return verts;
}

interface Chip {
    cx: number;
    cy: number;
    r: number;
    n: number;
    irr: number;
    colorIdx: number;
    sub: number;
}

export function paintTerrazzo(
    canvas: HTMLCanvasElement,
    seed: number,
    width: number,
    height: number,
): void {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const aspect = width / height;

    const seedRng = mulberry32(seed);
    const paletteNames = Object.keys(PALETTES);
    const styleNames = Object.keys(STYLES);
    const pal = PALETTES[paletteNames[Math.floor(seedRng() * paletteNames.length)]];
    const stylePreset = STYLES[styleNames[Math.floor(seedRng() * styleNames.length)]];

    const X = (x: number) => (x + aspect / 2) * height;
    const Y = (y: number) => (0.5 - y) * height;

    ctx.fillStyle = pal[0];
    ctx.fillRect(0, 0, width, height);

    const chipPalette = pal.slice(1);
    const minSize = stylePreset.minSize / 1000;
    const maxSize = Math.max(minSize + 0.005, stylePreset.maxSize / 1000);

    const rng = mulberry32(seed);
    const xSpan = aspect;
    const chips: Chip[] = [];

    const scaledDensity = Math.round(
        stylePreset.density * Math.max(1, aspect * 0.6),
    );

    if (stylePreset.algo === "palladiana") {
        const bigCount = 9 + Math.floor(rng() * 8);
        for (let i = 0; i < bigCount; i++) {
            chips.push({
                cx: (rng() - 0.5) * xSpan,
                cy: (rng() - 0.5) * 1.0,
                r: maxSize * (0.65 + rng() * 0.55),
                n: 4 + Math.floor(rng() * 3),
                irr: (stylePreset.chaos / 100) * 0.4,
                colorIdx: Math.floor(rng() * chipPalette.length),
                sub: Math.floor(rng() * 1e9),
            });
        }
        for (let i = 0; i < scaledDensity; i++) {
            const t = Math.pow(rng(), stylePreset.sizeBias);
            chips.push({
                cx: (rng() - 0.5) * xSpan * 1.05,
                cy: (rng() - 0.5) * 1.05,
                r: minSize + t * (maxSize * 0.25 - minSize),
                n: Math.max(3, stylePreset.sides + Math.floor((rng() - 0.5) * 3)),
                irr: stylePreset.chaos / 100,
                colorIdx: Math.floor(rng() * chipPalette.length),
                sub: Math.floor(rng() * 1e9),
            });
        }
    } else {
        for (let i = 0; i < scaledDensity; i++) {
            const t = Math.pow(rng(), stylePreset.sizeBias);
            chips.push({
                cx: (rng() - 0.5) * xSpan * 1.05,
                cy: (rng() - 0.5) * 1.05,
                r: minSize + t * (maxSize - minSize),
                n: Math.max(3, stylePreset.sides + Math.floor((rng() - 0.5) * 3)),
                irr: stylePreset.chaos / 100,
                colorIdx: Math.floor(rng() * chipPalette.length),
                sub: Math.floor(rng() * 1e9),
            });
        }
    }

    chips.sort((a, b) => b.r - a.r);

    for (const c of chips) {
        const localRng = mulberry32(c.sub);
        const verts = makeChipVerts(c.cx, c.cy, c.r, c.n, c.irr, localRng);
        ctx.fillStyle = jitterColor(chipPalette[c.colorIdx], localRng);
        ctx.beginPath();
        ctx.moveTo(X(verts[0].x), Y(verts[0].y));
        for (let i = 1; i < verts.length; i++) {
            ctx.lineTo(X(verts[i].x), Y(verts[i].y));
        }
        ctx.closePath();
        ctx.fill();
    }

    const gritCount = 200 + Math.floor(rng() * 400);
    ctx.fillStyle = cssColor(
        hexToRgb(pal[0]).map((c) => srgbToLinear(c) * 0.55) as RGB,
    );
    for (let i = 0; i < gritCount; i++) {
        const x = (rng() - 0.5) * xSpan;
        const y = (rng() - 0.5) * 1.0;
        const s = 0.4 + rng() * 1.4;
        ctx.beginPath();
        ctx.arc(X(x), Y(y), 0.0018 * s * height, 0, Math.PI * 2);
        ctx.fill();
    }
}

export function mountTerrazzo(el: HTMLElement): void {
    const seed = Number(el.dataset.seed ?? "1") || 1;
    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.setAttribute("aria-hidden", "true");
    el.appendChild(canvas);

    let lastKey = "";
    let rafId = 0;
    const repaint = () => {
        const rect = el.getBoundingClientRect();
        const w = Math.max(1, Math.floor(rect.width));
        const h = Math.max(1, Math.floor(rect.height));
        const key = `${w}x${h}`;
        if (key === lastKey) return;
        lastKey = key;
        paintTerrazzo(canvas, seed, w, h);
    };
    const ro = new ResizeObserver(() => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(repaint);
    });
    ro.observe(el);
    repaint();
}

export function mountTerrazzoBanners(): void {
    document
        .querySelectorAll<HTMLElement>("[data-terrazzo]")
        .forEach(mountTerrazzo);
}
