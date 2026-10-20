import type { DiagramType, detectType as DetectType, mount as Mount } from "pele/core";
import bundles from "./diagram-bundles.json";

const RETRY_DELAYS_MS = [400, 1600];

async function importFresh<T>(path: string): Promise<T> {
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

const loaded = new Map<string, Promise<{ mount: typeof Mount }>>();

function loadBundle(type: DiagramType) {
    const url = (bundles as Record<string, string>)[type];
    if (!url) return null;
    let bundle = loaded.get(url);
    if (!bundle) {
        bundle = importFresh<{ mount: typeof Mount }>(url);
        loaded.set(url, bundle);
    }
    return bundle;
}

export async function renderDiagrams(): Promise<void> {
    const blocks = Array.from(
        document.querySelectorAll<HTMLElement>("pre > code.language-mermaid"),
    );
    if (blocks.length === 0) return;

    const { detectType } = await importFresh<{ detectType: typeof DetectType }>(bundles.detect);

    await Promise.all(
        blocks.map(async (code) => {
            const pre = code.closest("pre");
            if (!pre) return;
            const source = code.textContent ?? "";
            let type: DiagramType | null = null;
            try {
                type = detectType(source);
            } catch {}
            const bundle = type && loadBundle(type);
            if (!bundle) {
                console.error("diagram type not recognised", type);
                return;
            }
            let mount: typeof Mount;
            try {
                ({ mount } = await bundle);
            } catch (error) {
                console.error("diagram renderer failed to load", error);
                return;
            }
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
