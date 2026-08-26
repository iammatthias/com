// Markdown twin of a publication index — `/<pub>.md`, prerendered.
// One file per publication: the whole section as a linked list of
// markdown twins.

export const prerender = true;

import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { publicationIndexMarkdown } from "@lib/markdown-view";
import type { DocumentData, PublicationData } from "@lib/farfield-loader";
import { publishedDocs } from "@lib/content-query";
import { SITE_ORIGIN } from "@lib/agent-surface";

export const getStaticPaths: GetStaticPaths = async () => {
    const pubs = (await getCollection("pubs")).map(
        (e) => e.data as PublicationData,
    );
    const docs = await publishedDocs();
    return pubs.map((pub) => {
        const items = docs.filter((d) => d.collection === pub.slug);
        return {
            params: { publication: pub.slug },
            props: { pub, items },
            cacheKey: items.map((d) => d.cid).join(","),
        };
    });
};

export const GET: APIRoute = ({ props }) => {
    const pub = props.pub as PublicationData;
    const items = props.items as DocumentData[];
    return new Response(
        publicationIndexMarkdown(pub, items, SITE_ORIGIN),
        { headers: { "Content-Type": "text/markdown; charset=utf-8" } },
    );
};
