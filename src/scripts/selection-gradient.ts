
const STOPS = 5;

const BLOCKS =
    "main :is(h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption,dt,dd,pre,th,td)";

function paint(): void {
    const els = [...document.querySelectorAll<HTMLElement>(BLOCKS)];
    const docH = document.documentElement.scrollHeight;
    if (!docH || !els.length) return;
    const tops = els.map((el) => {
        const r = el.getBoundingClientRect();
        return r.height ? r.top + scrollY + r.height / 2 : -1;
    });
    els.forEach((el, i) => {
        if (tops[i] < 0) return;
        const t = Math.min(0.999, Math.max(0, tops[i] / docH));
        const x = t * (STOPS - 1);
        const lo = Math.floor(x);
        const pct = Math.round((x - lo) * 100);
        el.style.setProperty(
            "--sel",
            `color-mix(in oklab, var(--sel-stop-${lo + 1}) ${pct}%, var(--sel-stop-${lo}))`,
        );
    });
}

let queued: ReturnType<typeof setTimeout> | null = null;
function schedule(): void {
    if (queued) clearTimeout(queued);
    queued = setTimeout(() => {
        queued = null;
        paint();
    }, 150);
}

paint();
window.addEventListener("resize", schedule, { passive: true });
window.addEventListener("load", schedule);
const main = document.querySelector("main");
if (main) {
    new MutationObserver(schedule).observe(main, {
        childList: true,
        subtree: true,
    });
}
