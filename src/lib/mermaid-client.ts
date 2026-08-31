
const MONO =
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

interface Palette {
    bg: string;
    fg: string;
    muted: string;
    border: string;
    accent: string;
}

const LIGHT: Palette = {
    bg: "#f1ebdc",
    fg: "#1c1a16",
    muted: "#7a7368",
    border: "#e6dfd1",
    accent: "#4a6b8a",
};
const DARK: Palette = {
    bg: "#1c1a16",
    fg: "#ece6da",
    muted: "#8a8278",
    border: "#2e2a23",
    accent: "#8eb0d0",
};

function themeVariables(p: Palette): Record<string, string> {
    return {
        background: p.bg,
        primaryColor: p.border,
        primaryTextColor: p.fg,
        primaryBorderColor: p.muted,
        secondaryColor: p.border,
        tertiaryColor: p.bg,
        lineColor: p.muted,
        textColor: p.fg,
        mainBkg: p.border,
        nodeBorder: p.muted,
        clusterBkg: p.bg,
        clusterBorder: p.border,
        titleColor: p.fg,
        edgeLabelBackground: p.bg,
        fontFamily: MONO,
        fontSize: "14px",
    };
}

let renderSeq = 0;

function pinNativeSize(figure: HTMLElement): void {
    const svg = figure.querySelector("svg");
    const vb = svg?.viewBox?.baseVal;
    if (!svg || !vb || !vb.width) return;
    svg.style.maxWidth = "none";
    svg.setAttribute("width", String(Math.ceil(vb.width)));
    svg.setAttribute("height", String(Math.ceil(vb.height)));
}

export async function renderMermaid(): Promise<void> {
    const blocks = Array.from(
        document.querySelectorAll<HTMLElement>("pre > code.language-mermaid"),
    );
    if (blocks.length === 0) return;

    const { default: mermaid } = await import("mermaid");

    const items = blocks
        .map((code) => {
            const pre = code.closest("pre");
            if (!pre) return null;
            const figure = document.createElement("figure");
            figure.className = "mermaid-figure";
            const source = code.textContent ?? "";
            pre.replaceWith(figure);
            return { source, figure };
        })
        .filter((x): x is { source: string; figure: HTMLElement } => x !== null);

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const paint = async () => {
        mermaid.initialize({
            startOnLoad: false,
            securityLevel: "strict",
            theme: "base",
            fontFamily: MONO,
            themeVariables: themeVariables(media.matches ? DARK : LIGHT),
        });
        await Promise.all(
            items.map(async ({ source, figure }) => {
                try {
                    const { svg } = await mermaid.render(
                        `mermaid-${renderSeq++}`,
                        source,
                    );
                    figure.innerHTML = svg;
                    pinNativeSize(figure);
                } catch (err) {
                    console.error("mermaid render failed", err);
                    const pre = document.createElement("pre");
                    const code = document.createElement("code");
                    code.className = "language-mermaid";
                    code.textContent = source;
                    pre.appendChild(code);
                    figure.replaceChildren(pre);
                }
            }),
        );
    };

    await paint();
    media.addEventListener("change", () => {
        void paint();
    });
}
