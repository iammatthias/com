import type { DiagramType, detectType as DetectType, mount as Mount } from "pele/core";
import manifest from "./diagram-bundles.json";

const bundles: Partial<Record<DiagramType | "detect", string>> = manifest;
const RETRY_DELAYS_MS = [400, 1600];

async function importWithRetry<T>(path: string): Promise<T> {
    const url = new URL(path, location.origin);
    for (let attempt = 0; ; attempt++) {
        if (attempt > 0) url.searchParams.set("retry", String(attempt));
        try {
            return await import(/* @vite-ignore */ url.href);
        } catch (error) {
            const delay = RETRY_DELAYS_MS[attempt];
            if (delay === undefined) throw error;
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
}

const renderers = new Map<DiagramType, Promise<typeof Mount>>();

function loadRenderer(type: DiagramType): Promise<typeof Mount> {
    let renderer = renderers.get(type);
    if (!renderer) {
        const path = bundles[type];
        renderer = path
            ? importWithRetry<{ mount: typeof Mount }>(path).then((m) => m.mount)
            : Promise.reject(new Error(`no renderer for ${type}`));
        renderers.set(type, renderer);
    }
    return renderer;
}

async function rendererFor(
    source: string,
    detectType: typeof DetectType,
): Promise<typeof Mount | null> {
    try {
        const type = detectType(source);
        if (!type) throw new Error("unrecognised diagram");
        return await loadRenderer(type);
    } catch (error) {
        console.error("diagram renderer unavailable", error);
        return null;
    }
}

export async function renderDiagrams(): Promise<void> {
    const blocks = Array.from(
        document.querySelectorAll<HTMLElement>("pre > code.language-mermaid"),
    );
    if (blocks.length === 0 || !bundles.detect) return;

    let detectType: typeof DetectType;
    try {
        ({ detectType } = await importWithRetry<{ detectType: typeof DetectType }>(bundles.detect));
    } catch (error) {
        console.error("diagram detector failed to load", error);
        return;
    }

    await Promise.all(
        blocks.map(async (code) => {
            const pre = code.closest("pre");
            if (!pre) return;
            const source = code.textContent ?? "";
            const mount = await rendererFor(source, detectType);
            if (!mount) return;
            const figure = document.createElement("figure");
            figure.className = "diagram-figure";
            pre.after(figure);
            const mounted = mount(figure, source);
            if (mounted.error) {
                mounted.destroy();
                figure.remove();
                console.error("diagram render failed", mounted.error);
                return;
            }
            pre.remove();
            if (!figure.querySelector("svg")?.hasAttribute("aria-labelledby")) {
                figure.setAttribute("role", "img");
                figure.setAttribute(
                    "aria-label",
                    `Diagram${mounted.result ? `: ${mounted.result.type}` : ""}`,
                );
            }
        }),
    );
}
