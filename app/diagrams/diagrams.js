import { detectType } from "pele/core";

let fontCss = "";
let fontReady = null;
let seq = 0;

function base64(bytes) {
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
}

export function setFont(bytes) {
    if (fontReady) return fontReady;
    const face = new FontFace("Inter", bytes.slice().buffer);
    document.fonts.add(face);
    fontCss = `@font-face{font-family:"Inter";src:url(data:font/ttf;base64,${base64(bytes)}) format("truetype");}`;
    fontReady = face.load().catch(() => {});
    return fontReady;
}

function themeCss(t) {
    const vars = {
        bg: t.paper,
        fg: t.ink,
        muted: t.muted,
        line: t.ink,
        surface: t.paper,
        "surface-alt": t.rule,
        border: t.rule,
        accent: t.accent,
        critical: t.stops[3],
        error: t.stops[3],
        radius: "4px",
        font: "Inter",
        "font-mono": "Inter",
    };
    for (let i = 0; i < 8; i++) vars[`series-${i + 1}`] = t.stops[i % t.stops.length];
    return `svg{${Object.entries(vars).map(([k, v]) => `--pele-${k}:${v}`).join(";")}}`;
}

export function kind(source) {
    return detectType(source);
}

export async function render(pele, source, theme, maxWidth, dpr) {
    await fontReady;
    const { svg, width: natW, height: natH } = pele(source, {
        fontFamily: "Inter",
        fontSize: 14,
        maxWidth,
        autoDirection: true,
        links: false,
        images: false,
        idPrefix: `d${seq++}-`,
    });
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    const el = doc.documentElement;
    const fit = Math.min(maxWidth / natW, 1);
    const cssW = natW * fit;
    const cssH = natH * fit;
    el.setAttribute("width", String(natW));
    el.setAttribute("height", String(natH));
    const style = doc.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = fontCss + themeCss(theme);
    el.insertBefore(style, el.firstChild);
    const text = new XMLSerializer().serializeToString(el);

    const url = URL.createObjectURL(new Blob([text], { type: "image/svg+xml" }));
    try {
        const img = new Image();
        img.src = url;
        await img.decode();
        const w = Math.max(1, Math.round(cssW * dpr));
        const h = Math.max(1, Math.round(cssH * dpr));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = theme.paper;
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const rgba = new Uint8Array(ctx.getImageData(0, 0, w, h).data.buffer);
        return { width: w, height: h, cssWidth: cssW, cssHeight: cssH, rgba };
    } finally {
        URL.revokeObjectURL(url);
    }
}
