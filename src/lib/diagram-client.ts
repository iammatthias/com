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
            pre.replaceWith(figure);
            await mountAsync(figure, source, {
                zoom: false,
                onError: (err) => {
                    console.error("diagram render failed", err);
                    figure.replaceChildren(pre);
                },
            });
        }),
    );
}
