import { FEED_ENVELOPE } from "./doc-render";

export interface RssItem {
    title?: string;
    description?: string;
    content?: string;
    link: string;
    pubDate: Date;
    categories?: string[];
    customData?: string;
}

function esc(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function canonical(link: string, site: string): string {
    const url = /^https?:\/\//.test(link) ? new URL(link) : new URL(link, site);
    if (!url.pathname.endsWith("/") && !/\.[a-z0-9]+$/i.test(url.pathname)) {
        url.pathname += "/";
    }
    return url.href;
}

/** Same document shape @astrojs/rss produced for the old site. */
export function rssXml(opts: {
    title: string;
    description: string;
    site: string;
    items: RssItem[];
}): string {
    const hasContent = opts.items.some((i) => typeof i.content === "string");
    const ns = [
        `version="2.0"`,
        ...(hasContent ? [`xmlns:content="http://purl.org/rss/1.0/modules/content/"`] : []),
        ...Object.entries(FEED_ENVELOPE.xmlns).map(([k, v]) => `xmlns:${k}="${v}"`),
    ].join(" ");
    const items = opts.items
        .map((item) => {
            const link = canonical(item.link, opts.site);
            return (
                "<item>" +
                (item.title ? `<title>${esc(item.title)}</title>` : "") +
                `<link>${esc(link)}</link>` +
                `<guid isPermaLink="true">${esc(link)}</guid>` +
                (item.description ? `<description>${esc(item.description)}</description>` : "") +
                `<pubDate>${item.pubDate.toUTCString()}</pubDate>` +
                (typeof item.content === "string"
                    ? `<content:encoded>${esc(item.content)}</content:encoded>`
                    : "") +
                (item.customData ?? "") +
                (item.categories ?? []).map((c) => `<category>${esc(c)}</category>`).join("") +
                "</item>"
            );
        })
        .join("");
    return (
        `<?xml version="1.0" encoding="UTF-8"?>` +
        `<?xml-stylesheet href="${FEED_ENVELOPE.stylesheet}" type="text/xsl"?>` +
        `<rss ${ns}><channel>` +
        `<title>${esc(opts.title)}</title>` +
        `<description>${esc(opts.description)}</description>` +
        `<link>${esc(canonical("/", opts.site))}</link>` +
        FEED_ENVELOPE.customData +
        items +
        `</channel></rss>`
    );
}

export function rssResponse(xml: string): Response {
    return new Response(xml, {
        headers: { "Content-Type": "application/xml" },
    });
}
