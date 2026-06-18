// Draft-preview gate — DEV ONLY.
//
// The content API returns unpublished drafts when authenticated, but
// the loader filters them out by default. Pages opt a request into
// showing drafts by threading `preview` into the Farfield document
// reads; this helper decides that boolean from the request.
//
// In production `isPreview` is hard-wired to `false`, so no query
// string or cookie can ever surface a draft on the live site.

import type { AstroCookies } from "astro";

/** Session cookie that keeps preview mode on across navigation. */
const PREVIEW_COOKIE = "ff_preview";

/**
 * Whether the current request should see unpublished drafts.
 *
 * Dev only. `?preview=1` turns preview on and remembers it via a
 * session cookie, so clicking from a list into a draft's detail page
 * keeps preview active without re-appending the param (otherwise the
 * detail page would 404 the draft). `?preview=0` turns it back off.
 * With neither param, the cookie decides.
 *
 * Pass `Astro` (it satisfies the `{ url, cookies }` shape). Safe to
 * call from both a page's frontmatter and the layout — setting the
 * same cookie twice in a request is idempotent.
 */
export function isPreview(astro: {
    url: URL;
    cookies: AstroCookies;
}): boolean {
    if (!import.meta.env.DEV) return false;

    const q = astro.url.searchParams.get("preview");
    if (q === "1") {
        astro.cookies.set(PREVIEW_COOKIE, "1", {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
        });
        return true;
    }
    if (q === "0") {
        astro.cookies.delete(PREVIEW_COOKIE, { path: "/" });
        return false;
    }
    return astro.cookies.get(PREVIEW_COOKIE)?.value === "1";
}
