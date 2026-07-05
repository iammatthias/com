import type { APIRoute } from "astro";
import { headFromGet } from "@lib/http";

export const GET: APIRoute = ({ site }) => {
    const sitemap = new URL("/sitemap.xml", site).toString();
    const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`;
    return new Response(body, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
};

export const HEAD = headFromGet(GET);
