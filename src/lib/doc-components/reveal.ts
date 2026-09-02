import { escapeHtml } from "../format";
import type { ComponentProps, DocComponent, Renderer } from "./types";

function labelOf(props: ComponentProps): string {
    return props.label?.trim() || "Show";
}

export const reveal: DocComponent = {
    name: "ff-reveal",

    async render(
        props: ComponentProps,
        children: string,
        html: Renderer<Promise<string>>,
    ): Promise<string> {
        return (
            `<details class="ff-reveal">` +
            `<summary>${escapeHtml(labelOf(props))}</summary>` +
            `<div class="ff-reveal-body">${await html(children)}</div>` +
            `</details>`
        );
    },

    async feed(
        props: ComponentProps,
        children: string,
        html: Renderer<Promise<string>>,
    ): Promise<string> {
        return (
            `<details><summary>${escapeHtml(labelOf(props))}</summary>` +
            `${await html(children)}</details>`
        );
    },

    markdown(
        props: ComponentProps,
        children: string,
        markdown: Renderer<string>,
    ): string {
        return `*${labelOf(props)}*\n\n${markdown(children).trim()}`;
    },

    text(props: ComponentProps): string {
        return labelOf(props);
    },
};
