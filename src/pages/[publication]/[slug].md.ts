// Markdown twin of the document detail page — `/<pub>/<slug>.md`.
// Prerendered: one static file per entry, cacheKey'd by cid so the
// incremental build regenerates a twin only when its record changes.
// Serves the source markdown with embeds resolved to public URLs and
// record metadata as front matter.

export const prerender = true;

import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import {
    composeDocumentMarkdown,
    resolveEmbedsForMarkdown,
} from "@lib/markdown-view";
import type { DocumentData } from "@lib/farfield-loader";

export const getStaticPaths: GetStaticPaths = async () => {
    const docs = (await getCollection("docs")).map(
        (e) => e.data as DocumentData,
    );
    return docs.map((doc) => {
        // Same tag-scored neighbours the HTML page shows, so the two
        // representations agree about what's related.
        const shared = (tags: string[]) =>
            tags.filter((t) => doc.tags.includes(t)).length;
        const related = docs
            .filter(
                (d) =>
                    d.published !== false &&
                    !(d.collection === doc.collection && d.rkey === doc.rkey),
            )
            .sort(
                (a, b) =>
                    shared(b.tags) - shared(a.tags) ||
                    b.publishedAt.localeCompare(a.publishedAt),
            )
            .slice(0, 5)
            .map((d) => ({
                title: d.title,
                href: d.href,
                description: d.description,
            }));
        return {
            params: { publication: doc.collection, slug: doc.rkey },
            props: { doc, related },
            cacheKey: [doc.cid, ...related.map((r) => r.href)].join(":"),
        };
    });
};

export const GET: APIRoute = async ({ props }) => {
    const doc = props.doc as DocumentData;
    const related = props.related as Array<{
        title: string;
        href: string;
        description: string;
    }>;
    const origin = "https://iammatthias.com";
    const bodyMd = await resolveEmbedsForMarkdown(doc.body);
    return new Response(composeDocumentMarkdown(doc, bodyMd, origin, related), {
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
};
