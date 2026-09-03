
export const prerender = true;

import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { publicationIndexMarkdown } from "@lib/markdown-view";
import {
    renderKey,
    type DocumentData,
    type PublicationData,
} from "@lib/farfield-loader";
import { publishedDocs } from "@lib/content-query";
import { SITE_ORIGIN } from "@lib/agent-surface";
import { markdownResponse } from "@lib/agent-http";

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
            cacheKey: items.map(renderKey).join(","),
        };
    });
};

export const GET: APIRoute = ({ props }) => {
    const pub = props.pub as PublicationData;
    const items = props.items as DocumentData[];
    return markdownResponse(publicationIndexMarkdown(pub, items, SITE_ORIGIN));
};
