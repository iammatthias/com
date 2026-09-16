import { describe, expect, test } from "bun:test";
import {
    clamp01,
    clamp3,
    cssColor,
    hexToRgb,
    hslToRgb,
    linearToSrgb,
    mix3,
    rgbToHsl,
    scale3,
    srgbToLinear,
    type Rgb,
} from "./color";

describe("hexToRgb", () => {
    test("maps the endpoints and a known mid colour", () => {
        expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
        expect(hexToRgb("#ffffff")).toEqual([1, 1, 1]);
        expect(hexToRgb("#ff8000")).toEqual([1, 128 / 255, 0]);
    });

    test("channels are not transposed", () => {
        expect(hexToRgb("#010203")).toEqual([1 / 255, 2 / 255, 3 / 255]);
    });
});

describe("sRGB transfer", () => {
    test("round-trips across the full range", () => {
        for (let i = 0; i <= 255; i++) {
            const c = i / 255;
            expect(linearToSrgb(srgbToLinear(c))).toBeCloseTo(c, 12);
        }
    });

    test("anchors at both ends", () => {
        expect(srgbToLinear(0)).toBe(0);
        expect(srgbToLinear(1)).toBeCloseTo(1, 12);
        expect(linearToSrgb(0)).toBe(0);
        expect(linearToSrgb(1)).toBeCloseTo(1, 12);
    });

    test("is continuous across the piecewise join to within the standard's own kink", () => {
        const eps = 1e-9;
        expect(srgbToLinear(0.04045 - eps)).toBeCloseTo(srgbToLinear(0.04045 + eps), 8);
        expect(linearToSrgb(0.0031308 - eps)).toBeCloseTo(linearToSrgb(0.0031308 + eps), 8);
    });

    test("linear light is darker than its sRGB encoding in the midtones", () => {
        expect(srgbToLinear(0.5)).toBeLessThan(0.5);
    });
});

describe("HSL round trip", () => {
    test("returns the original colour for a spread of hues", () => {
        for (const rgb of [
            [0.2, 0.4, 0.8],
            [0.9, 0.1, 0.3],
            [0.5, 0.5, 0.5],
            [1, 1, 1],
            [0, 0, 0],
            [0.7, 0.7, 0.2],
        ] as Rgb[]) {
            const back = hslToRgb(rgbToHsl(rgb));
            for (let i = 0; i < 3; i++) expect(back[i]).toBeCloseTo(rgb[i], 12);
        }
    });

    test("greys carry no hue or saturation", () => {
        const [h, s] = rgbToHsl([0.3, 0.3, 0.3]);
        expect(h).toBe(0);
        expect(s).toBe(0);
    });

    test("hue lands in the right sixth for the primaries", () => {
        expect(rgbToHsl([1, 0, 0])[0]).toBeCloseTo(0, 12);
        expect(rgbToHsl([0, 1, 0])[0]).toBeCloseTo(1 / 3, 12);
        expect(rgbToHsl([0, 0, 1])[0]).toBeCloseTo(2 / 3, 12);
    });
});

describe("cssColor", () => {
    test("converts out of linear light on the way to a css string", () => {
        expect(cssColor([0, 0, 0])).toBe("rgb(0,0,0)");
        expect(cssColor([1, 1, 1])).toBe("rgb(255,255,255)");
    });

    test("mid-grey linear does not come out as 128", () => {
        expect(cssColor([0.5, 0.5, 0.5])).toBe("rgb(188,188,188)");
    });

    test("clamps values outside the gamut", () => {
        expect(cssColor([-1, 2, 0.5])).toBe("rgb(0,255,188)");
    });
});

describe("palette triplet maths", () => {
    test("mix3 interpolates and hits both endpoints exactly", () => {
        const a: Rgb = [0, 0.5, 1];
        const b: Rgb = [1, 0.5, 0];
        expect(mix3(a, b, 0)).toEqual(a);
        expect(mix3(a, b, 1)).toEqual(b);
        expect(mix3(a, b, 0.5)).toEqual([0.5, 0.5, 0.5]);
    });

    test("mix3 keeps the a*(1-t)+b*t form the azulejo palettes were tuned on", () => {
        const a: Rgb = [0.1, 0.2, 0.3];
        const b: Rgb = [0.7, 0.8, 0.9];
        const t = 0.37;
        expect(mix3(a, b, t)).toEqual([
            a[0] * (1 - t) + b[0] * t,
            a[1] * (1 - t) + b[1] * t,
            a[2] * (1 - t) + b[2] * t,
        ]);
    });

    test("scale3 scales every channel", () => {
        expect(scale3([0.2, 0.4, 0.6], 0.5)).toEqual([0.1, 0.2, 0.3]);
    });

    test("clamp3 and clamp01 confine to the unit interval", () => {
        expect(clamp3([-0.5, 0.5, 1.5])).toEqual([0, 0.5, 1]);
        expect(clamp01(-1)).toBe(0);
        expect(clamp01(2)).toBe(1);
        expect(clamp01(0.25)).toBe(0.25);
    });
});
