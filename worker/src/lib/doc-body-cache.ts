import { renderFeedBody, renderMarkdownBody } from "./doc-render";
import { bodyRenderKey, type DocumentData } from "./farfield-loader";
import { cachedRender } from "./render-cache";
import { mapWithConcurrency } from "./http";

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
                customData: `<media:content url="${thumb}" medium="image"/>`,
            }),
        };
    });
}
