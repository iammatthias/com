export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
    const n = parseInt(hex.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export const srgbToLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

export const linearToSrgb = (c: number) =>
    c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

export function rgbToHsl([r, g, b]: Rgb): Rgb {
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

export function hue2rgb(p: number, q: number, t: number): number {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * 6 * (2 / 3 - t);
    return p;
}

export function hslToRgb([h, s, l]: Rgb): Rgb {
    if (s === 0) return [l, l, l];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}

/** Terrazzo mixes in linear space, so this converts back on the way out. */
export function cssColor([r, g, b]: Rgb): string {
    const to255 = (c: number) =>
        Math.max(0, Math.min(255, Math.round(linearToSrgb(c) * 255)));
    return `rgb(${to255(r)},${to255(g)},${to255(b)})`;
}

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * Azulejo blends palette triplets naively, channel by channel, in whatever
 * space the palette was authored in. That is deliberate and is not the same
 * as the linear-space mixing terrazzo does above.
 */
export const mix3 = (a: Rgb, b: Rgb, t: number): Rgb => [
    a[0] * (1 - t) + b[0] * t,
    a[1] * (1 - t) + b[1] * t,
    a[2] * (1 - t) + b[2] * t,
];

export const scale3 = (a: Rgb, k: number): Rgb => [a[0] * k, a[1] * k, a[2] * k];

export const clamp3 = (a: Rgb): Rgb => [clamp01(a[0]), clamp01(a[1]), clamp01(a[2])];
