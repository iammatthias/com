import type { BlobMeta, Collection, Entry, Post, Series } from "../src/lib/farfield";
import { forgetMemo } from "../src/lib/memo";
import { setRuntimeEnv } from "../src/lib/runtime-env";

export interface FarfieldWorld {
    collections?: Collection[];
    entries?: Entry[];
    posts?: Post[];
    series?: Series[];
    blobs?: BlobMeta[];
}

const realFetch = globalThis.fetch;

export function collection(slug: string, name: string, description?: string): Collection {
    return { slug, name, description, createdAt: "2024-01-01T00:00:00Z", entryCount: 0 };
}

export function entry(fields: Partial<Entry> & Pick<Entry, "collection" | "slug" | "cid">): Entry {
    return {
        title: fields.slug,
        body: "",
        tags: [],
        published: true,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-02T00:00:00Z",
        ...fields,
    };
}

export function post(fields: Partial<Post> & Pick<Post, "slug" | "cid">): Post {
    return {
        body: "",
        tags: [],
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        ...fields,
    };
}

export function serveFarfield(world: FarfieldWorld): { asked: string[] } {
    forgetMemo();
    setRuntimeEnv(undefined);
    const asked: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
        const url = new URL(input instanceof Request ? input.url : String(input));
        asked.push(url.href);
        const at = `${url.host}${url.pathname}`;
        if (at === "content.farfield.systems/api/collections") return Response.json({ collections: world.collections ?? [] });
        if (at === "content.farfield.systems/api/entries") return Response.json({ entries: world.entries ?? [] });
        if (at === "content.farfield.systems/api/series") return Response.json({ series: world.series ?? [] });
        if (at === "feed.farfield.systems/api/posts") return Response.json({ posts: world.posts ?? [] });
        const series = /^content\.farfield\.systems\/api\/series\/(.+)$/.exec(at);
        if (series) {
            const found = world.series?.find((s) => s.slug === decodeURIComponent(series[1]));
            return found ? Response.json(found) : new Response("not found", { status: 404 });
        }
        const meta = /^blobs\.farfield\.systems\/blobs\/([a-z0-9]+)\/meta$/.exec(at);
        if (meta) {
            const found = world.blobs?.find((b) => b.cid === meta[1]);
            return found ? Response.json(found) : new Response("not found", { status: 404 });
        }
        return new Response("not stubbed", { status: 404 });
    }) as typeof fetch;
    return { asked };
}

export function restoreFetch(): void {
    globalThis.fetch = realFetch;
    forgetMemo();
}
