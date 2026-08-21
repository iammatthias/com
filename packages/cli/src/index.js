// SDK for iammatthias.com's public content API.
//
// Zero dependencies, works in Node and any fetch-capable runtime. The
// site is public and unauthenticated, so there is no client to
// construct and no key to pass — every function is a plain call.
//
//   import { search, getDocument, listSections } from "iammatthias";
//   const hits = await search("cloudflare workers");

const DEFAULT_ORIGIN = "https://iammatthias.com";

export class SiteError extends Error {
    constructor(problem, status) {
        super(problem?.detail ?? `Request failed with status ${status}`);
        this.name = "SiteError";
        this.code = problem?.code ?? "http_error";
        this.status = status;
        /** How to fix the request and retry — supplied by the API. */
        this.resolution = problem?.resolution;
    }
}

async function get(path, { origin = DEFAULT_ORIGIN, signal } = {}) {
    const res = await fetch(origin + path, {
        headers: {
            accept: "application/json",
            "user-agent": "iammatthias-cli/1.0 (+https://iammatthias.com/developers)",
        },
        signal,
    });
    if (!res.ok) {
        let problem = null;
        try {
            problem = await res.json();
        } catch {
            /* non-JSON error body */
        }
        throw new SiteError(problem, res.status);
    }
    return res.json();
}

/** Search the site. Returns ranked hits with URLs. */
export async function search(query, { limit = 10, ...opts } = {}) {
    const qs = new URLSearchParams({ q: query, limit: String(limit) });
    const { hits } = await get(`/api/search.json?${qs}`, opts);
    return hits;
}

/** List published documents, optionally filtered. */
export async function listContent({ section, tag, limit, ...opts } = {}) {
    const qs = new URLSearchParams();
    if (section) qs.set("section", section);
    if (tag) qs.set("tag", tag);
    if (limit) qs.set("limit", String(limit));
    const suffix = qs.toString() ? `?${qs}` : "";
    const { items } = await get(`/api/content.json${suffix}`, opts);
    return items;
}

/** The site's publications with entry counts. */
export async function listSections(opts = {}) {
    const { data } = await graphql(
        `{ sections { slug name description entryCount url } }`,
        {},
        opts,
    );
    return data.sections;
}

/** Fetch one document's markdown source (front matter included). */
export async function getDocument(pathOrSlug, { origin = DEFAULT_ORIGIN, signal } = {}) {
    const clean = String(pathOrSlug)
        .replace(/^https?:\/\/[^/]+/, "")
        .replace(/^\/|\.md$/g, "");
    const res = await fetch(`${origin}/${clean}.md`, {
        headers: {
            accept: "text/markdown",
            "user-agent": "iammatthias-cli/1.0 (+https://iammatthias.com/developers)",
        },
        signal,
    });
    if (!res.ok) {
        throw new SiteError(
            {
                code: "not_found",
                detail: `No document at "${pathOrSlug}".`,
                resolution: "Use search() or listContent() to find a valid path.",
            },
            res.status,
        );
    }
    return res.text();
}

/** Run an arbitrary GraphQL query against the site. */
export async function graphql(query, variables = {}, { origin = DEFAULT_ORIGIN, signal } = {}) {
    const res = await fetch(`${origin}/graphql`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "user-agent": "iammatthias-cli/1.0 (+https://iammatthias.com/developers)",
        },
        body: JSON.stringify({ query, variables }),
        signal,
    });
    const payload = await res.json();
    if (payload.errors?.length && !payload.data) {
        const e = payload.errors[0];
        throw new SiteError(
            {
                code: e.extensions?.code ?? "graphql_error",
                detail: e.message,
                resolution: e.extensions?.resolution,
            },
            res.status,
        );
    }
    return payload;
}

/** The whole corpus in one request — every document, front matter included. */
export async function fetchCorpus({ origin = DEFAULT_ORIGIN, signal } = {}) {
    const res = await fetch(`${origin}/llms-full.txt`, { signal });
    if (!res.ok) throw new SiteError(null, res.status);
    return res.text();
}

export const ORIGIN = DEFAULT_ORIGIN;
