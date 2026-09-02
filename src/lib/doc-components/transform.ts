import { getDocComponent } from "./registry";
import type { ComponentProps, DocComponent, Renderer } from "./types";
import { escapeHtml } from "../format";

const TAG = "ff-[a-z0-9-]+";
const ATTRS = `(?:\\s+[a-zA-Z_:][\\w:.-]*(?:\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s"'>]+))?)*`;
const TAG_RE = new RegExp(`<(${TAG})(${ATTRS})\\s*(/?)>`, "g");
const ATTR_RE =
    /([a-zA-Z_:][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

const PLACEHOLDER = (i: number) => `<!--FFCOMP:${i}-->`;
const PLACEHOLDER_RE = /(?:<p>\s*)?<!--FFCOMP:(\d+)-->(?:\s*<\/p>)?/g;

function maskCodeKeepingOffsets(src: string): string {
    const blank = (m: string) => m.replace(/[^\n]/g, " ");
    return src
        .replace(/```[\s\S]*?```/g, blank)
        .replace(/~~~[\s\S]*?~~~/g, blank)
        .replace(/`[^`\n]*`/g, blank);
}

function parseAttrs(raw: string): ComponentProps {
    const props: ComponentProps = {};
    for (const m of raw.matchAll(ATTR_RE)) {
        const value = m[2] ?? m[3] ?? m[4];
        props[m[1].toLowerCase()] = value ?? "";
    }
    return props;
}

interface FoundTag {
    name: string;
    props: ComponentProps;
    children: string;
    start: number;
    end: number;
}

function findTagsOutsideCode(src: string): FoundTag[] {
    const masked = maskCodeKeepingOffsets(src);
    const found: FoundTag[] = [];
    TAG_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = TAG_RE.exec(masked)) !== null) {
        const [full, name, rawAttrs, selfClosing] = m;
        const start = m.index;
        const asVoid = (): FoundTag => ({
            name,
            props: parseAttrs(rawAttrs),
            children: "",
            start,
            end: start + full.length,
        });
        if (selfClosing) {
            found.push(asVoid());
            continue;
        }
        const close = masked.indexOf(`</${name}>`, start + full.length);
        if (close === -1) {
            found.push(asVoid());
            continue;
        }
        const end = close + `</${name}>`.length;
        found.push({
            name,
            props: parseAttrs(rawAttrs),
            children: src.slice(start + full.length, close),
            start,
            end,
        });
        TAG_RE.lastIndex = end;
    }
    return found;
}

function unknownComponentMarkup(name: string): string {
    return `<p class="ff-component-missing" role="note">Unknown component <code>&lt;${name}&gt;</code>. It may not be deployed yet.</p>`;
}

async function feedMarkup(
    component: DocComponent,
    tag: FoundTag,
    html: Renderer<Promise<string>>,
): Promise<string> {
    if (component.feed) return component.feed(tag.props, tag.children, html);
    const text = component.text?.(tag.props, tag.children, componentsToText);
    return text ? `<p>${escapeHtml(text)}</p>` : "";
}

export type ComponentSurface = "site" | "feed";

export interface ComponentPass {
    source: string;
    rendered: string[];
    used: string[];
}

export async function extractDocComponents(
    body: string,
    surface: ComponentSurface,
    html: Renderer<Promise<string>>,
): Promise<ComponentPass> {
    const tags = findTagsOutsideCode(body);
    if (tags.length === 0) {
        return { source: body, rendered: [], used: [] };
    }

    let source = "";
    let cursor = 0;
    tags.forEach((tag, i) => {
        source += body.slice(cursor, tag.start);
        source += `\n\n${PLACEHOLDER(i)}\n\n`;
        cursor = tag.end;
    });
    source += body.slice(cursor);

    const fallback = (name: string) =>
        surface === "site" ? unknownComponentMarkup(name) : "";

    const rendered = await Promise.all(
        tags.map(async (tag) => {
            const component = getDocComponent(tag.name);
            if (!component) {
                console.warn(
                    `[doc-components] unknown component <${tag.name}>`,
                );
                return fallback(tag.name);
            }
            try {
                return surface === "feed"
                    ? await feedMarkup(component, tag, html)
                    : await component.render(tag.props, tag.children, html);
            } catch (err) {
                console.error(
                    `[doc-components] <${tag.name}> failed to render:`,
                    err,
                );
                return fallback(tag.name);
            }
        }),
    );

    return {
        source,
        rendered,
        used: [...new Set(tags.map((t) => t.name))],
    };
}

export function substituteDocComponents(
    html: string,
    rendered: string[],
): string {
    return html.replace(
        PLACEHOLDER_RE,
        (_, idx: string) => rendered[Number(idx)] ?? "",
    );
}

function replaceTags(
    body: string,
    replacement: (tag: FoundTag) => string,
): string {
    const tags = findTagsOutsideCode(body);
    if (tags.length === 0) return body;
    let out = "";
    let cursor = 0;
    for (const tag of tags) {
        out += body.slice(cursor, tag.start) + replacement(tag);
        cursor = tag.end;
    }
    return out + body.slice(cursor);
}

export function componentsToText(body: string): string {
    return replaceTags(body, (tag) => {
        const text = getDocComponent(tag.name)?.text?.(
            tag.props,
            tag.children,
            componentsToText,
        );
        return text ? ` ${text} ` : " ";
    });
}

export function componentsToMarkdown(body: string): string {
    return replaceTags(body, (tag) => {
        const component = getDocComponent(tag.name);
        if (!component) return body.slice(tag.start, tag.end);
        return (
            component.markdown?.(tag.props, tag.children, componentsToMarkdown) ??
            component.text?.(tag.props, tag.children, componentsToText) ??
            ""
        );
    });
}
