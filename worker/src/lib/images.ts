
export const FIG_WIDTHS = [480, 720, 960, 1280];
export const FIG_SIZES =
    "(max-width: 768px) calc(100vw - 32px), 608px";

export const SERIES_WIDTHS = [320, 480, 640, 800, 960, 1280];
export const SERIES_SIZES =
    "(max-width: 480px) calc(100vw - 32px), (max-width: 768px) calc((100vw - 48px) / 2), (min-width: 1200px) 30vw, 320px";

const GRID_WIDTHS = [320, 480, 640, 800];
const GRID_SIZES = "(max-width: 768px) 50vw, 304px";

export const ARCH_WIDTHS = [480, 720, 960, 1280, 1600];
export const ARCH_SIZES =
    "(max-width: 768px) calc(100vw - 32px), 60vh";

export const ZOOM_WIDTHS = [1280, 1920, 2560];
export const ZOOM_QUALITY = 80;
export const ZOOM_SIZES = "100vw";
export const ZOOM_FALLBACK_WIDTH = 1920;

export function tilePreset(isGallery: boolean): {
    widths: readonly number[];
    sizes: string;
} {
    return isGallery
        ? { widths: GRID_WIDTHS, sizes: GRID_SIZES }
        : { widths: FIG_WIDTHS, sizes: FIG_SIZES };
}
