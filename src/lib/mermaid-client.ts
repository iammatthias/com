// Client-side mermaid renderer.
//
// Farfield bodies are markdown rendered by `marked`, which turns a
// ```mermaid fenced block into a plain `<pre><code class="language-mermaid">`
// — raw diagram source, no SVG. This walks those blocks after the page
// loads, lazy-imports mermaid (so the ~hundreds-of-KB library only ever
// downloads on the rare page that actually has a diagram), and swaps each
// block for a rendered figure.
//
// Theming is driven off the same palette as `globals.css`. mermaid bakes
// concrete colors into the SVG at render time, so it can't lean on the
// CSS `light-dark()` token the rest of the site uses — instead we read the
// user's `prefers-color-scheme`, pick the matching palette, and re-render
// on change so the diagram follows the page in and out of dark mode.

// Literal mono stack (mirrors `--font-mono`). mermaid injects this inline
// into the SVG, so we pass the resolved stack rather than the CSS var.
const MONO =
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

interface Palette {
    bg: string;
    fg: string;
    muted: string;
    border: string;
    accent: string;
}

// Pulled straight from the `--color-*` tokens in `globals.css`.
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

// Map the site palette onto mermaid's "base" theme variables. Node fill
// uses the border token so diagrams read like the code blocks they sit
// beside; edges/labels use foreground/muted ink.
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

// Each render() call needs a DOM-unique id or mermaid collides its
// generated SVG/marker ids. Bump per paint so re-renders stay clean.
let renderSeq = 0;

// mermaid emits the SVG with `width="100%"` + an inline `max-width`, which
// scales the whole diagram — text included — down to the container width.
// On a phone that shrinks labels to a few unreadable pixels. Pin the SVG
// to its intrinsic size from the viewBox instead and let `.mermaid-figure`
// scroll horizontally: the same deal as a wide code block, so labels stay
// full-size and the reader pans to see the rest.
function pinNativeSize(figure: HTMLElement): void {
    const svg = figure.querySelector("svg");
    const vb = svg?.viewBox?.baseVal;
    if (!svg || !vb || !vb.width) return;
    svg.style.maxWidth = "none";
    svg.setAttribute("width", String(Math.ceil(vb.width)));
    svg.setAttribute("height", String(Math.ceil(vb.height)));
}

/**
 * Find every `language-mermaid` code block, render it to SVG, and keep it
 * in sync with the user's color scheme. No-ops (and never imports mermaid)
 * when the page has no diagrams.
 */
export async function renderMermaid(): Promise<void> {
    const blocks = Array.from(
        document.querySelectorAll<HTMLElement>("pre > code.language-mermaid"),
    );
    if (blocks.length === 0) return;

    const { default: mermaid } = await import("mermaid");

    // Snapshot source + swap each <pre> for a persistent <figure> mount
    // up front, so the color-scheme re-render path repaints in place
    // instead of hunting for code blocks that no longer exist.
    const items = blocks
        .map((code) => {
            const pre = code.closest("pre");
            if (!pre) return null;
            const figure = document.createElement("figure");
            figure.className = "mermaid-figure";
            // `textContent` decodes the entities `marked` escaped in the
            // source (`--&gt;` → `-->`, `&quot;` → `"`), handing mermaid
            // back the original diagram text.
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
                    // Leave the raw source visible rather than a blank gap,
                    // so a malformed diagram is still readable/debuggable.
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
    // Follow the page when the OS theme flips. `matchMedia` change fires
    // for both directions; re-init + repaint recolors every diagram.
    media.addEventListener("change", () => {
        void paint();
    });
}
