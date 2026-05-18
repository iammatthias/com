// Responsive image presets — width arrays + `sizes` strings — for
// every surface that pulls Farfield blobs through wsrv. One file so a
// tweak to (say) the zoom widths only needs to land here.

/** Doc-body inline figures. Cap at 1280 — reading column tops out at
 *  720px, so 1280 is enough for 2× retina without bloating the bundle. */
export const FIG_WIDTHS = [480, 720, 960, 1280];
export const FIG_SIZES =
    "(max-width: 768px) calc(100vw - 32px), 720px";

/** Series tiles inside a doc body's masonry gallery. */
export const SERIES_WIDTHS = [320, 480, 640, 800];
export const SERIES_SIZES =
    "(max-width: 480px) calc(100vw - 32px), (max-width: 768px) calc((100vw - 48px) / 2), 320px";

/** Now-feed thumbnails — narrower column than doc body. */
export const FEED_WIDTHS = [320, 480, 720, 960];
export const FEED_SIZES =
    "(max-width: 768px) calc(100vw - 32px), 60ch";

/**
 * Homepage arch (the Glass-sourced featured photo). The arch is
 * 70dvh tall × 6/7 aspect → about 60dvh wide. On mobile it shrinks to
 * column width minus body padding. Widths cover 1× → 2× retina across
 * phones, tablets, and laptops.
 */
export const ARCH_WIDTHS = [480, 720, 960, 1280, 1600];
export const ARCH_SIZES =
    "(max-width: 768px) calc(100vw - 32px), 60vh";

/**
 * Lightbox/zoom srcset. Three tight widths so wsrv's cache converges
 * on a small set of URLs across visitors (cold-fetch TTFB is the real
 * bottleneck, not bytes — caching matters more than pixel-perfect
 * sizing). q=80 keeps fine detail at roughly half the bytes of q=85.
 */
export const ZOOM_WIDTHS = [1280, 1920, 2560];
export const ZOOM_QUALITY = 80;
export const ZOOM_SIZES = "100vw";
/** Fallback `src` for the lightbox image when srcset isn't honored. */
export const ZOOM_FALLBACK_WIDTH = 1920;

/**
 * Pick the right srcset widths + `sizes` string for a tile depending
 * on whether it's the only image in its row or one of several inside
 * a gallery. Sizes drives the browser's responsive selection — if
 * `sizes` overstates the rendered width, the browser fetches a
 * needlessly-large variant. Galleries lay out at roughly half-column,
 * so the smaller `SERIES_*` preset fits.
 */
export function tilePreset(isGallery: boolean): {
    widths: readonly number[];
    sizes: string;
} {
    return isGallery
        ? { widths: SERIES_WIDTHS, sizes: SERIES_SIZES }
        : { widths: FIG_WIDTHS, sizes: FIG_SIZES };
}
