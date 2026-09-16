/**
 * A canvas that fills its container. Callers set their own aria treatment:
 * the azulejo tile is a labelled image, the terrazzo banner is decorative.
 */
export function createRasterCanvas(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    return canvas;
}

/**
 * Size a canvas to device pixels, capped at 2x.
 *
 * The rounding mode is load-bearing: the azulejo shader feeds this pixel count
 * into uRes, which drives the grout grain, the Bayer dither and the hash
 * grain. Math.round here, never floor or ceil.
 */
export function sizeToDpr(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
): { width: number; height: number; ratio: number } {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(width * ratio));
    const h = Math.max(1, Math.round(height * ratio));
    canvas.width = w;
    canvas.height = h;
    return { width: w, height: h, ratio };
}
