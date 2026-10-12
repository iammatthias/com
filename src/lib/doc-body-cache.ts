import { renderFeedBody, renderMarkdownBody } from "./doc-render";
import { seriesIndex, seriesKeyFor, type DocumentData } from "./farfield-loader";
import { cachedRender } from "./render-cache";
import { mapWithConcurrency } from "./http";

async function bodyRenderKey(doc: Pick<DocumentData, "cid" | "body">): Promise<string> {
    if (!doc.body.includes("series://")) return doc.cid;
    const seriesKey = seriesKeyFor(doc.body, await seriesIndex());
    return seriesKey ? `${doc.cid}@${seriesKey}` : doc.cid;
}

export async function cachedDocBody(doc: Pick<DocumentData, "cid" | "body">): Promise<string> {
    if (!doc.body) return "";
    return cachedRender("docbody", await bodyRenderKey(doc), () => renderMarkdownBody(doc.body));
}

export async function cachedFeedBody(
    doc: Pick<DocumentData, "cid" | "body">,
    moreUrl: string,
): Promise<string> {
    return cachedRender("docfeedbody", await bodyRenderKey(doc), () =>
        renderFeedBody(doc.body, { maxImages: 6, moreUrl }),
    );
}

export async function docFeedItems(items: DocumentData[], origin: string) {
    return mapWithConcurrency(items, 8, async (item) => {
        const canonical = `${origin}${item.href}`;
        const content = await cachedFeedBody(item, canonical);
        const thumb = content.match(/<img src="([^"]+)"/)?.[1];
        return {
            title: item.title,
            description: item.description,
            content,
            link: item.href,
            pubDate: new Date(item.publishedAt),
            categories: [item.publication.name, ...item.tags],
            ...(thumb && {
                customData: `<media:content url="${thumb}" medium="image" />`,
            }),
        };
    });
}
