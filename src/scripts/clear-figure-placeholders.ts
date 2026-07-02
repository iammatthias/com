// Image figures carry the blob's dominant colour as an inline
// background — a load-time placeholder that fills the aspect-ratio box
// before the bytes arrive. It must be cleared once the image loads, or
// it shows through transparent PNGs forever. (The homepage arch is a
// <div>, not a <figure>, so it keeps its frame colour.)
//
// Imported by BaseLayout's page script so the behavior applies on
// every page that renders blob-backed figures.

for (const fig of document.querySelectorAll('figure[style*="background"]')) {
    const img = fig.querySelector("img");
    if (!img) continue;
    const clear = () => {
        (fig as HTMLElement).style.background = "";
    };
    if (img.complete) clear();
    else img.addEventListener("load", clear, { once: true });
}
