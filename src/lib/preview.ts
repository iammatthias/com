
import type { AstroCookies } from "astro";

const PREVIEW_COOKIE = "ff_preview";

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
