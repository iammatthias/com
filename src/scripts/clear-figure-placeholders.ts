
for (const fig of document.querySelectorAll('figure[style*="background"]')) {
    const img = fig.querySelector("img");
    if (!img) continue;
    const clear = () => {
        (fig as HTMLElement).style.background = "";
    };
    if (img.complete) clear();
    else img.addEventListener("load", clear, { once: true });
}
