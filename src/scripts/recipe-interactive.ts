
export function initRecipes(): void {
    for (const root of document.querySelectorAll<HTMLElement>(".ff-recipe")) {
        enhance(root);
    }
}

const VULGAR: Record<string, number> = {
    "¼": 1 / 4, "½": 1 / 2, "¾": 3 / 4, "⅓": 1 / 3, "⅔": 2 / 3,
    "⅛": 1 / 8, "⅜": 3 / 8, "⅝": 5 / 8, "⅞": 7 / 8,
};
const GLYPH: [number, string][] = Object.entries(VULGAR)
    .map(([g, v]) => [v, g] as [number, string])
    .sort((a, b) => a[0] - b[0]);

const QTY_SRC =
    "(?:\\d+\\s+\\d+/\\d+|\\d+/\\d+|\\d*[¼½¾⅓⅔⅛⅜⅝⅞]|\\d+(?:\\.\\d+)?)";
const AMOUNT_RE = new RegExp(
    `^(${QTY_SRC})(\\s*[–-]\\s*(${QTY_SRC}))?(.*)$`,
);

function qtyValue(tok: string): number {
    const vulgar = tok.match(/^(\d*)([¼½¾⅓⅔⅛⅜⅝⅞])$/);
    if (vulgar) return Number(vulgar[1] || 0) + VULGAR[vulgar[2]];
    const mixed = tok.match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$/);
    if (mixed) return Number(mixed[1] || 0) + Number(mixed[2]) / Number(mixed[3]);
    return Number(tok);
}

function fmtQty(v: number): string {
    if (v >= 10) return String(Math.round(v));
    let best = { err: Infinity, n: Math.round(v), d: 1 };
    for (const d of [1, 2, 3, 4, 8]) {
        const n = Math.round(v * d);
        const err = Math.abs(v - n / d);
        if (err < best.err - 1e-9) best = { err, n, d };
    }
    let whole = Math.floor(best.n / best.d);
    const frac = best.n / best.d - whole;
    if (frac === 0) return String(whole);
    const glyph = GLYPH.find(([val]) => Math.abs(val - frac) < 1e-9)?.[1];
    if (!glyph) return String(Math.round((whole + frac) * 100) / 100);
    return (whole ? String(whole) : "") + glyph;
}

function fixUnits(rest: string, qty: number): string {
    const plural = qty > 1;
    return rest.replace(
        /\b(tablespoon|teaspoon|cup|clove|can|sprig|slice|stick)(s?)\b/i,
        (_m, unit: string, s: string) => unit + (plural ? "s" : ""),
    );
}

export function scaleAmount(base: string, f: number): string | null {
    const m = base.match(AMOUNT_RE);
    if (!m) return null;
    const a = qtyValue(m[1]) * f;
    const b = m[3] ? qtyValue(m[3]) * f : null;
    const qty = fmtQty(a) + (b !== null ? `–${fmtQty(b)}` : "");
    return qty + fixUnits(m[4], b ?? a);
}

const fmtClock = (n: number) =>
    `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;

function enhance(root: HTMLElement): void {
    root.classList.add("ff-live");

    for (const th of root.querySelectorAll<HTMLElement>(".ff-r-ing")) {
        th.tabIndex = 0;
        th.setAttribute("role", "button");
        th.setAttribute("aria-pressed", "false");
        const toggle = () => {
            th.classList.toggle("off");
            th.setAttribute("aria-pressed", String(th.classList.contains("off")));
        };
        th.addEventListener("click", toggle);
        th.addEventListener("keydown", (e) => {
            if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                toggle();
            }
        });
    }

    const controls = root.querySelector<HTMLElement>(".ff-recipe-controls");
    const serves = Number(root.dataset.serves) || 0;
    if (controls && serves > 0) {
        const amts = [...root.querySelectorAll<HTMLElement>(".ff-r-amt")]
            .map((el) => ({ el, base: el.textContent ?? "" }))
            .filter((a) => scaleAmount(a.base, 1) !== null);
        const yieldDd = root.querySelector<HTMLElement>(".ff-recipe-meta dd");
        const yieldBase = yieldDd?.textContent ?? "";
        if (amts.length) {
            controls.hidden = false;
            controls.addEventListener("click", (e) => {
                const b = (e.target as HTMLElement).closest<HTMLElement>(
                    "button[data-factor]",
                );
                if (!b) return;
                const f = Number(b.dataset.factor);
                for (const x of controls.querySelectorAll("button")) {
                    x.setAttribute("aria-pressed", String(x === b));
                }
                for (const a of amts) {
                    a.el.textContent =
                        f === 1 ? a.base : scaleAmount(a.base, f) ?? a.base;
                }
                if (yieldDd) {
                    yieldDd.textContent =
                        f === 1
                            ? yieldBase
                            : yieldBase
                                  .replace(/\d+(\s*[–-]\s*\d+)?/, (m) => {
                                      const [lo, hi] = m.split(/[–-]/).map((s) => Number(s.trim()));
                                      const scale = (n: number) => fmtQty(n * f);
                                      return hi ? `${scale(lo)}–${scale(hi)}` : scale(lo);
                                  })
                                  .replace(/\b1 servings\b/, "1 serving");
                }
            });
        }
    }

    const lis = [...root.querySelectorAll<HTMLElement>(".ff-recipe-steps li[data-step]")];
    const firstGrid = root.querySelector<HTMLElement>(".ff-recipe-grid-wrap");
    if (!firstGrid || lis.length === 0) return;
    const stepIds = lis.map((li) => li.dataset.step as string);

    const panel = document.createElement("div");
    panel.className = "ff-recipe-stage";
    panel.hidden = true;
    panel.innerHTML =
        `<div class="ff-rs-head"><span class="ff-rs-n"></span>` +
        `<span class="ff-rs-title"></span>` +
        `<button type="button" class="ff-rs-clock" hidden></button>` +
        `<span class="ff-rs-nav">` +
        `<button type="button" data-nav="prev">Back</button>` +
        `<button type="button" data-nav="next">Next</button>` +
        `<button type="button" data-nav="exit" aria-label="Exit step focus">Exit</button>` +
        `</span></div>` +
        `<div class="ff-rs-text"></div>`;
    firstGrid.before(panel);
    const nEl = panel.querySelector<HTMLElement>(".ff-rs-n")!;
    const titleEl = panel.querySelector<HTMLElement>(".ff-rs-title")!;
    const textEl = panel.querySelector<HTMLElement>(".ff-rs-text")!;
    const clock = panel.querySelector<HTMLButtonElement>(".ff-rs-clock")!;

    const labelFor = new Map<string, string>();
    for (const cell of root.querySelectorAll<HTMLElement>("td.ff-r-op[data-step]")) {
        labelFor.set(
            cell.dataset.step as string,
            cell.querySelector(".ff-r-lbl")?.textContent ?? "",
        );
    }

    let active = -1;
    let tick: ReturnType<typeof setInterval> | null = null;

    const stopClock = () => {
        if (tick) clearInterval(tick);
        tick = null;
        clock.classList.remove("ring");
    };
    const armClock = (secs: number | null) => {
        stopClock();
        clock.hidden = !secs;
        if (!secs) return;
        clock.textContent = `▸ ${fmtClock(secs)}`;
        clock.onclick = () => {
            stopClock();
            let n = secs;
            clock.textContent = fmtClock(n);
            tick = setInterval(() => {
                n--;
                if (n <= 0) {
                    stopClock();
                    clock.textContent = "time!";
                    clock.classList.add("ring");
                } else {
                    clock.textContent = fmtClock(n);
                }
            }, 1000);
            clock.onclick = () => armClock(secs);
        };
    };

    const cellsFor = (id: string) =>
        root.querySelectorAll<HTMLElement>(
            `td.ff-r-op[data-step="${CSS.escape(id)}"]`,
        );

    const light = (i: number) => {
        for (const x of root.querySelectorAll(".hot")) x.classList.remove("hot");
        for (const t of root.querySelectorAll(".ff-recipe-grid")) {
            t.classList.toggle("dim", i >= 0);
        }
        if (i < 0) return;
        for (const cell of cellsFor(stepIds[i])) {
            cell.classList.add("hot");
            const tbody = cell.closest("tbody");
            if (!tbody) continue;
            const r0 = Number(cell.dataset.row0);
            const n = Number(cell.dataset.nrows);
            [...tbody.children].slice(r0, r0 + n).forEach((tr) => tr.classList.add("hot"));
        }
        lis[i].classList.add("hot");
    };

    const exit = () => {
        active = -1;
        panel.hidden = true;
        stopClock();
        light(-1);
    };
    const goTo = (i: number) => {
        active = Math.max(0, Math.min(stepIds.length - 1, i));
        panel.hidden = false;
        nEl.textContent = `Step ${active + 1} of ${stepIds.length}`;
        titleEl.textContent = labelFor.get(stepIds[active]) ?? "";
        const li = lis[active];
        const clone = li.cloneNode(true) as HTMLElement;
        clone.querySelector(".ff-r-for")?.remove();
        textEl.innerHTML = clone.innerHTML;
        light(active);
        armClock(Number(li.dataset.secs) || null);
    };

    panel.addEventListener("click", (e) => {
        const b = (e.target as HTMLElement).closest<HTMLElement>("[data-nav]");
        if (!b) return;
        if (b.dataset.nav === "exit") exit();
        else goTo(active + (b.dataset.nav === "next" ? 1 : -1));
    });
    root.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && active >= 0) exit();
    });

    for (const cell of root.querySelectorAll<HTMLElement>("td.ff-r-op[data-step]")) {
        cell.tabIndex = 0;
        cell.setAttribute("role", "button");
        const activate = () => {
            const i = stepIds.indexOf(cell.dataset.step as string);
            if (i < 0) return;
            if (i === active) exit();
            else goTo(i);
        };
        cell.addEventListener("click", activate);
        cell.addEventListener("keydown", (e) => {
            if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                activate();
            }
        });

        const peek = (on: boolean) => {
            for (const c of cellsFor(cell.dataset.step as string)) {
                c.classList.toggle("peek", on);
                const tbody = c.closest("tbody");
                if (!tbody) continue;
                const r0 = Number(c.dataset.row0);
                const n = Number(c.dataset.nrows);
                [...tbody.children]
                    .slice(r0, r0 + n)
                    .forEach((tr) => tr.classList.toggle("peek", on));
            }
            const i = stepIds.indexOf(cell.dataset.step as string);
            if (i >= 0) lis[i].classList.toggle("peek", on);
        };
        cell.addEventListener("mouseenter", () => peek(true));
        cell.addEventListener("mouseleave", () => peek(false));
    }
}
