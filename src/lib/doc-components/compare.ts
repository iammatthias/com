import { blobURL, getBlobMeta } from "../farfield-loader";
import { wsrvUrl, wsrvSrcSet } from "../farfield";
import { FIG_WIDTHS, FIG_SIZES } from "../images";
import { escapeAttr } from "../format";
import type { ComponentProps, DocComponent } from "./types";

function cidOf(raw: string | undefined): string | null {
    if (!raw) return null;
    const trimmed = raw.trim();
    const m = trimmed.match(/^blob:\/\/([a-z0-9-]+)$/);
    if (m) return m[1];
    return /^[a-z0-9]+$/.test(trimmed) ? trimmed : null;
}

export const compare: DocComponent = {
    name: "ff-compare",

    async render(props: ComponentProps): Promise<string> {
        const beforeCid = cidOf(props.before);
        const afterCid = cidOf(props.after);
        if (!beforeCid || !afterCid) {
            return `<p class="ff-component-missing" role="note">&lt;ff-compare&gt; needs <code>before</code> and <code>after</code> blob references.</p>`;
        }

        const [beforeMeta, afterMeta] = await Promise.all([
            getBlobMeta(beforeCid),
            getBlobMeta(afterCid),
        ]);

        const beforeSrc = blobURL(beforeCid);
        const afterSrc = blobURL(afterCid);
        const width = afterMeta?.width ?? beforeMeta?.width ?? 960;
        const height = afterMeta?.height ?? beforeMeta?.height ?? 720;

        const labelBefore = props["label-before"] || "Before";
        const labelAfter = props["label-after"] || "After";
        const altBefore = props["alt-before"] || `${labelBefore} image`;
        const altAfter = props["alt-after"] || `${labelAfter} image`;
        const start = Number(props.start);
        const startPct =
            Number.isFinite(start) && start >= 0 && start <= 100 ? start : 50;

        const img = (src: string, alt: string): string =>
            `<img class="ff-compare-img" src="${wsrvUrl(src, 960)}" ` +
            `srcset="${wsrvSrcSet(src, FIG_WIDTHS)}" sizes="${FIG_SIZES}" ` +
            `width="${width}" height="${height}" alt="${escapeAttr(alt)}" ` +
            `loading="lazy" decoding="async" />`;

        const background = afterMeta?.dominantColor
            ? ` style="background:${escapeAttr(afterMeta.dominantColor)}"`
            : "";

        return (
            `<ff-compare class="ff-compare" data-start="${startPct}" ` +
            `style="--ff-compare-pos:${startPct}%">` +
            `<figure class="ff-compare-frame"${background}>` +
            `<div class="ff-compare-layer ff-compare-after">` +
            img(afterSrc, altAfter) +
            `<span class="ff-compare-label ff-compare-label-after">${escapeAttr(labelAfter)}</span>` +
            `</div>` +
            `<div class="ff-compare-layer ff-compare-before">` +
            img(beforeSrc, altBefore) +
            `<span class="ff-compare-label ff-compare-label-before">${escapeAttr(labelBefore)}</span>` +
            `</div>` +
            `<div class="ff-compare-handle" aria-hidden="true"></div>` +
            `</figure>` +
            `<label class="ff-compare-control">` +
            `<span class="ff-compare-control-label">Reveal ${escapeAttr(labelBefore)}</span>` +
            `<input type="range" min="0" max="100" value="${startPct}" step="1" ` +
            `class="ff-compare-range" aria-label="Compare ${escapeAttr(labelBefore)} and ${escapeAttr(labelAfter)}" />` +
            `</label>` +
            `</ff-compare>`
        );
    },

    text(props: ComponentProps): string {
        const before = props["label-before"] || "before";
        const after = props["label-after"] || "after";
        return `[image comparison: ${before} versus ${after}]`;
    },
};
