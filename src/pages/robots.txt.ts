import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
    const sitemap = new URL("/sitemap-index.xml", site).toString();
    const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`;
    return new Response(body, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
};
