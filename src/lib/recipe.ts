
import { parse as parseYAML } from "yaml";
import { marked } from "marked";

export type Ingredient = {
    id: string; item: string; amount?: string; note?: string; group?: string;
};
export type Step = {
    id: string; in: string[]; do: string; detail?: string;
    for?: string;
    phase?: string; prep?: boolean; title?: string; vertical?: boolean;
};
export type Recipe = {
    yield?: string; time?: string; source?: string; sourceURL?: string;
    notes?: string; ingredients: Ingredient[]; steps: Step[];
};
export type Cell = {
    step?: Step; text: string; for?: string; rowSpan: number; colSpan: number;
    vertical: boolean; gap: boolean;
};
export type Row = { ingredient: Ingredient; cells: Cell[] };
export type Grid = { title: string; rows: Row[]; width: number };

const AUTO_VERTICAL_MAX = 34;

const slug = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function parseRecipe(src: string): Recipe {
    const raw = parseYAML(src) ?? {};
    const rec: Recipe = {
        ...raw,
        ingredients: (raw.ingredients ?? []).map((i: any) => ({ ...i })),
        steps: (raw.steps ?? []).map((s: any) => ({ ...s, in: s.in ?? [] })),
    };
    if (!rec.ingredients.length) throw new Error("recipe: no ingredients");
    if (!rec.steps.length) throw new Error("recipe: no steps");

    const taken = new Set<string>();
    rec.ingredients.forEach((ing, i) => {
        if (!ing.item?.trim()) throw new Error(`recipe: ingredient ${i + 1} has no item`);
        let id = ing.id || slug(ing.item) || `i${i + 1}`;
        const base = id;
        for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
        taken.add(id);
        ing.id = id;
    });
    rec.steps.forEach((st, i) => {
        if (!st.do?.trim()) throw new Error(`recipe: step ${i + 1} has no \`do\``);
        const id = st.id || `s${i + 1}`;
        if (taken.has(id)) throw new Error(`recipe: duplicate id "${id}"`);
        taken.add(id);
        st.id = id;
    });

    let prev = "";
    for (const st of rec.steps) {
        if (st.prep) continue;
        if (!st.in.length) {
            if (!prev) throw new Error(`recipe: step "${st.id}" is first and needs an \`in\``);
            st.in = [prev];
        }
        prev = st.id;
    }

    const kind = new Map<string, "ingredient" | "step">();
    rec.ingredients.forEach((i) => kind.set(i.id, "ingredient"));
    rec.steps.forEach((s) => kind.set(s.id, "step"));
    const used = new Set<string>();
    for (const st of rec.steps) {
        if (st.prep && st.in.length) throw new Error(`recipe: step "${st.id}" is \`prep\` and cannot take an \`in\``);
        const seen = new Set<string>();
        for (const ref of st.in) {
            if (!kind.has(ref)) throw new Error(`recipe: step "${st.id}" refers to unknown id "${ref}"`);
            if (ref === st.id) throw new Error(`recipe: step "${st.id}" refers to itself`);
            if (seen.has(ref)) throw new Error(`recipe: step "${st.id}" lists "${ref}" twice`);
            seen.add(ref);
            used.add(ref);
        }
    }
    const orphans = rec.ingredients.filter((i) => !used.has(i.id)).map((i) => i.id);
    if (orphans.length) throw new Error(`recipe: no step uses ${orphans.sort().join(", ")}`);

    const stepAt = new Map(rec.steps.map((s, i) => [s.id, i]));
    const color = new Map<string, number>();
    const walk = (id: string) => {
        if (kind.get(id) === "ingredient") return;
        if (color.get(id) === 1) throw new Error(`recipe: steps form a cycle at "${id}"`);
        if (color.get(id) === 2) return;
        color.set(id, 1);
        rec.steps[stepAt.get(id)!].in.forEach(walk);
        color.set(id, 2);
    };
    rec.steps.forEach((s) => walk(s.id));
    return rec;
}

export function layout(rec: Recipe): Grid[] {
    const stepAt = new Map(rec.steps.map((s, i) => [s.id, i]));
    const ingAt = new Map(rec.ingredients.map((g, i) => [g.id, i]));
    const consumed = new Set(rec.steps.flatMap((s) => s.in));
    const roots = rec.steps.filter((s) => !s.prep && !consumed.has(s.id));

    return roots.map((root) => {
        const order: string[] = [];
        const first = new Map<string, number>();
        const span = new Map<string, number>();
        const col = new Map<string, number>();
        const seen = new Set<string>();

        const walk = (id: string) => {
            if (seen.has(id))
                throw new Error(`recipe: "${id}" feeds two branches of the same grid`);
            seen.add(id);
            if (ingAt.has(id)) {
                first.set(id, order.length); span.set(id, 1); col.set(id, -1);
                order.push(id);
                return;
            }
            const st = rec.steps[stepAt.get(id)!];
            const start = order.length;
            let best = -1;
            for (const ref of st.in) { walk(ref); best = Math.max(best, col.get(ref)!); }
            first.set(id, start);
            span.set(id, order.length - start);
            col.set(id, best + 1);
        };
        walk(root.id);

        const rows = order.length;
        const width = col.get(root.id)! + 1;
        const start: (Step | undefined)[][] =
            Array.from({ length: rows }, () => Array(width).fill(undefined));
        const covered: boolean[][] =
            Array.from({ length: rows }, () => Array(width).fill(false));

        for (const id of seen) {
            if (!stepAt.has(id)) continue;
            const st = rec.steps[stepAt.get(id)!];
            const c = col.get(id)!, r0 = first.get(id)!, n = span.get(id)!;
            start[r0][c] = st;
            for (let k = 0; k < n; k++) covered[r0 + k][c] = true;
        }

        const out: Row[] = [];
        for (let r = 0; r < rows; r++) {
            const cells: Cell[] = [];
            for (let c = 0; c < width; ) {
                const st = start[r][c];
                if (st) {
                    const n = span.get(st.id)!;
                    const len = Math.max(
                        st.do.trim().length,
                        (st.for ?? "").trim().length,
                    );
                    cells.push({
                        step: st, text: st.do, for: st.for, rowSpan: n,
                        colSpan: 1, gap: false,
                        vertical: st.vertical ?? (n >= 2 && len <= AUTO_VERTICAL_MAX),
                    });
                    c++;
                    continue;
                }
                if (covered[r][c]) { c++; continue; }
                let run = 0;
                while (c + run < width && !covered[r][c + run]) run++;
                cells.push({ text: "", rowSpan: 1, colSpan: run, vertical: false, gap: true });
                c += run;
            }
            out.push({ ingredient: rec.ingredients[ingAt.get(order[r])!], cells });
        }
        return {
            title: roots.length > 1 ? (root.title || root.do) : "",
            rows: out,
            width,
        };
    });
}

const RECIPE_FENCE = /^([ \t]*)(`{3,}|~{3,})[ \t]*recipe[ \t]*$/;

export function extractRecipes(
    body: string,
    placeholder = (i: number) => `<!--ffrecipe${i}-->`,
): { body: string; blocks: string[] } {
    const lines = body.split("\n");
    const out: string[] = [];
    const blocks: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        const m = RECIPE_FENCE.exec(lines[i]);
        if (!m) { out.push(lines[i]); continue; }
        const fence = m[2];
        const inner: string[] = [];
        let j = i + 1;
        for (; j < lines.length; j++) {
            const t = lines[j].trim();
            if (t.length >= fence.length && t.split(fence[0]).join("") === "") break;
            inner.push(lines[j]);
        }
        if (j >= lines.length) { out.push(lines[i]); continue; }
        out.push(placeholder(blocks.length));
        blocks.push(inner.join("\n"));
        i = j;
    }
    return { body: out.join("\n"), blocks };
}

function esc(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function inline(s: string): string {
    let out: string;
    try {
        out = (marked.parse(s, { async: false }) as string).trim();
    } catch {
        return esc(s);
    }
    const innerBody = out.slice(3, -4);
    if (
        out.startsWith("<p>") &&
        out.endsWith("</p>") &&
        !innerBody.includes("<p>")
    ) {
        return innerBody;
    }
    return out;
}

const fold = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

export function forSeconds(f: string | undefined): number | null {
    if (!f) return null;
    const pick = (m: RegExpMatchArray | null) => {
        if (!m) return 0;
        const range = m[1].split(/[–-]/);
        return Number(range[range.length - 1]);
    };
    const h = pick(f.match(/(\d+(?:[–-]\d+)?)\s*h(?:ours?|rs?)?\b/i));
    const min = pick(f.match(/(\d+(?:[–-]\d+)?)\s*m(?:in(?:utes?)?)?\b/i));
    const secs = h * 3600 + min * 60;
    return secs > 0 ? secs : null;
}

function leadsWith(detail: string, label: string): boolean {
    const l = fold(label);
    return l !== "" && fold(detail).startsWith(l);
}

function metaHtml(rec: Recipe): string {
    const pairs: [string, string][] = [];
    if (rec.yield?.trim()) pairs.push(["Yield", rec.yield]);
    if (rec.time?.trim()) pairs.push(["Time", rec.time]);
    if (!pairs.length) return "";
    const items = pairs
        .map(([dt, dd]) => `<div><dt>${esc(dt)}</dt><dd>${esc(dd)}</dd></div>`)
        .join("");
    return `<dl class="ff-recipe-meta">${items}</dl>`;
}

function ingredientSpans(ing: Ingredient): string {
    const amt = ing.amount
        ? `<span class="ff-r-amt">${esc(ing.amount)}</span>`
        : "";
    const note = ing.note
        ? `<span class="ff-r-note">${inline(ing.note)}</span>`
        : "";
    return (
        `<span class="ff-r-line">${amt}<span class="ff-r-item">${esc(ing.item)}</span></span>` +
        note
    );
}

function ingredientCell(ing: Ingredient, prevGroup: string | undefined): string {
    const group =
        ing.group && ing.group !== prevGroup
            ? `<span class="ff-r-group">${esc(ing.group)}</span>`
            : "";
    return `<th scope="row" class="ff-r-ing">${group}${ingredientSpans(ing)}</th>`;
}

function gridHtml(grid: Grid): string {
    const rows = grid.rows
        .map((row, r) => {
            const prevGroup = r > 0 ? grid.rows[r - 1].ingredient.group : undefined;
            const cells = row.cells
                .map((cell) => {
                    if (cell.gap) {
                        const span = cell.colSpan > 1 ? ` colspan="${cell.colSpan}"` : "";
                        return `<td${span} class="ff-r-gap"></td>`;
                    }
                    const span = cell.rowSpan > 1 ? ` rowspan="${cell.rowSpan}"` : "";
                    const cls = cell.vertical ? "ff-r-op ff-r-vert" : "ff-r-op";
                    const secs = forSeconds(cell.for);
                    const data =
                        ` data-step="${attrEsc(cell.step!.id)}"` +
                        ` data-row0="${r}" data-nrows="${cell.rowSpan}"` +
                        (secs ? ` data-secs="${secs}"` : "");
                    const forSpan = cell.for
                        ? `<span class="ff-r-for">${esc(cell.for)}</span>`
                        : "";
                    return `<td${span} class="${cls}"${data}><span class="ff-r-lbl">${esc(cell.text)}</span>${forSpan}</td>`;
                })
                .join("");
            return `<tr>${ingredientCell(row.ingredient, prevGroup)}${cells}</tr>`;
        })
        .join("");
    const caption = grid.title
        ? `<figcaption>${esc(grid.title)}</figcaption>`
        : "";
    return (
        `<figure class="ff-recipe-grid-wrap">${caption}` +
        `<div class="ff-recipe-scroll" tabindex="0" role="region" aria-label="Recipe grid">` +
        `<table class="ff-recipe-grid"><tbody>${rows}</tbody></table>` +
        `</div></figure>`
    );
}

const attrEsc = esc;

function ingredientListHtml(rec: Recipe): string {
    let prevGroup = "";
    const items = rec.ingredients
        .map((ing) => {
            let out = "";
            if (ing.group && ing.group !== prevGroup) {
                prevGroup = ing.group;
                out += `<li class="ff-r-grouprow">${esc(ing.group)}</li>`;
            }
            return out + `<li>${ingredientSpans(ing)}</li>`;
        })
        .join("");
    return `<h3 class="ff-recipe-h">Ingredients</h3><ul class="ff-recipe-ingredients">${items}</ul>`;
}

function stepItemHtml(st: Step, surface: "site" | "feed" = "site"): string {
    const forHtml =
        st.for && surface === "site"
            ? `<span class="ff-r-for">${esc(st.for)}</span>`
            : "";
    const forSuffix =
        st.for && surface === "feed" ? ` — ${esc(st.for)}` : "";
    const secs = surface === "site" ? forSeconds(st.for) : null;
    const open =
        `<li${surface === "site" ? ` data-step="${attrEsc(st.id)}"` : ""}` +
        `${secs ? ` data-secs="${secs}"` : ""}>${forHtml}`;
    if (!st.detail) return `${open}${inline(st.do)}${forSuffix}</li>`;
    if (leadsWith(st.detail, st.do))
        return `${open}${inline(st.detail)}${forSuffix}</li>`;
    return `${open}<strong class="ff-r-do">${esc(st.do)}</strong> ${inline(st.detail)}${forSuffix}</li>`;
}

function methodHtml(rec: Recipe): string {
    const parts: string[] = [`<h3 class="ff-recipe-h">Method</h3>`];
    let openPhase: string | undefined;
    let items: string[] = [];
    const flush = () => {
        if (!items.length) return;
        if (openPhase) {
            parts.push(`<h4 class="ff-recipe-phase">${esc(openPhase)}</h4>`);
        }
        parts.push(`<ol class="ff-recipe-steps">${items.join("")}</ol>`);
        items = [];
    };
    for (const st of rec.steps) {
        const phase = st.phase?.trim() || undefined;
        if (phase !== openPhase) {
            flush();
            openPhase = phase;
        }
        items.push(stepItemHtml(st));
    }
    flush();
    return parts.join("");
}

function notesHtml(rec: Recipe): string {
    if (!rec.notes) return "";
    return `<div class="ff-recipe-notes">${inline(rec.notes)}</div>`;
}

function sourceHtml(rec: Recipe): string {
    const label = rec.source || rec.sourceURL || "";
    if (!label) return "";
    const inner = rec.sourceURL
        ? `<a href="${esc(rec.sourceURL)}" rel="noopener">${esc(label)}</a>`
        : esc(label);
    return `<p class="ff-recipe-source">Source: ${inner}</p>`;
}

export function recipeHtml(src: string): string {
    let rec: Recipe;
    try {
        rec = parseRecipe(src);
    } catch (e) {
        return (
            `<div class="ff-recipe-error"><p>${esc(String(e))}</p>` +
            `<pre><code>${esc(src)}</code></pre></div>`
        );
    }
    let body: string;
    try {
        body = layout(rec).map(gridHtml).join("");
    } catch {
        body = ingredientListHtml(rec);
    }
    const serves = Number(rec.yield?.match(/\d+/)?.[0]) || 0;
    const servesAttr = serves > 0 ? ` data-serves="${serves}"` : "";
    const controls =
        serves > 0
            ? `<div class="ff-recipe-controls" hidden>` +
              `<span class="ff-rc-label">Serves</span>` +
              [0.5, 1, 2]
                  .map((f) => {
                      const n = serves * f;
                      const label = Number.isInteger(n)
                          ? String(n)
                          : String(Math.floor(n)) + "½";
                      return `<button type="button" data-factor="${f}" aria-pressed="${f === 1}">${label}</button>`;
                  })
                  .join("") +
              `</div>`
            : "";
    return (
        `<div class="ff-recipe"${servesAttr}>${metaHtml(rec)}${controls}${body}` +
        `<div class="ff-recipe-detail">${methodHtml(rec)}${notesHtml(rec)}${sourceHtml(rec)}</div>` +
        `</div>`
    );
}

export function recipeSimpleHtml(src: string): string {
    let rec: Recipe;
    try {
        rec = parseRecipe(src);
    } catch (e) {
        return `<p><em>${esc(String(e))}</em></p>`;
    }
    const meta = [
        rec.yield?.trim() ? `Yield: ${rec.yield}` : "",
        rec.time?.trim() ? `Time: ${rec.time}` : "",
    ]
        .filter(Boolean)
        .join(" · ");
    const items = rec.ingredients
        .map((ing) => {
            const amt = ing.amount?.trim() ? `${ing.amount} ` : "";
            const note = ing.note?.trim() ? ` (${ing.note})` : "";
            return `<li>${esc(`${amt}${ing.item}${note}`)}</li>`;
        })
        .join("");
    const steps = rec.steps.map((s) => stepItemHtml(s, "feed")).join("");
    return (
        (meta ? `<p><em>${esc(meta)}</em></p>` : "") +
        `<ul>${items}</ul><ol>${steps}</ol>` +
        notesHtml(rec) +
        sourceHtml(rec)
    );
}

export function recipeText(src: string): string {
    try {
        const rec = parseRecipe(src);
        let group = "";
        let phase = "";
        return [
            rec.yield,
            rec.time,
            ...rec.ingredients.flatMap((i) => {
                const g = i.group && i.group !== group ? i.group : undefined;
                group = i.group ?? group;
                return [g, i.amount, i.item, i.note];
            }),
            ...rec.steps.flatMap((s) => {
                const p = s.phase && s.phase !== phase ? s.phase : undefined;
                phase = s.phase ?? phase;
                return [p, s.do, s.detail];
            }),
            rec.notes,
            rec.source,
        ]
            .filter((s): s is string => Boolean(s?.trim()))
            .join(" ");
    } catch {
        return "";
    }
}
