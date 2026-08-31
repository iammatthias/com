
export const prerender = true;

import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import {
    composeDocumentMarkdown,
    resolveEmbedsForMarkdown,
} from "@lib/markdown-view";
import type { DocumentData } from "@lib/farfield-loader";
import { relatedDocs } from "@lib/content-query";
import { SITE_ORIGIN } from "@lib/agent-surface";
import { markdownResponse } from "@lib/agent-http";

export const getStaticPaths: GetStaticPaths = async () => {
    const docs = (await getCollection("docs")).map(
        (e) => e.data as DocumentData,
    );
    return docs.map((doc) => {
        const neighbours = relatedDocs(doc, docs);
        const related = neighbours.map((d) => ({
            title: d.title,
            href: d.href,
            description: d.description,
        }));
        return {
            params: { publication: doc.collection, slug: doc.rkey },
            props: { doc, related },
            cacheKey: [doc.cid, ...neighbours.map((d) => d.cid)].join(":"),
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
    const origin = SITE_ORIGIN;
    const bodyMd = await resolveEmbedsForMarkdown(doc.body);
    return markdownResponse(composeDocumentMarkdown(doc, bodyMd, origin, related));
};
