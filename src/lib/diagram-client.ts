export async function renderDiagrams(): Promise<void> {
    const blocks = Array.from(
        document.querySelectorAll<HTMLElement>("pre > code.language-mermaid"),
    );
    if (blocks.length === 0) return;

    const { mountAsync } = await import("pele/lazy");

    await Promise.all(
        blocks.map(async (code) => {
            const pre = code.closest("pre");
            if (!pre) return;
            const source = code.textContent ?? "";
            const figure = document.createElement("figure");
            figure.className = "diagram-figure";
            pre.after(figure);
            const mounted = await mountAsync(figure, source);
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
