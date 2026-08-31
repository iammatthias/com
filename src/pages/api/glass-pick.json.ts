
import type { APIRoute } from "astro";
import { wsrvUrl, wsrvSrcSet } from "@lib/farfield";
import { ARCH_WIDTHS, ARCH_SIZES } from "@lib/images";
import { headFromGet } from "@lib/http";

export const prerender = false;

interface GlassExif {
    date_time_original?: string;
    camera?: string;
    lens?: string;
    aperture?: string;
    focal_length?: string;
    iso?: string;
    exposure_time?: string;
}

interface GlassPost {
    id: string;
    description?: string;
    width: number;
    height: number;
    image1656x0?: string;
    image2048x2048?: string;
    prominent_color?: string;
    exif?: GlassExif;
    series?: { title?: string };
    share_url?: string;
}

const WINDOW = 25;
const GLASS_URL = `https://glass.photo/api/v3/users/iam/posts?limit=${WINDOW}`;
const GLASS_TTL_MS = 5 * 60_000;

async function fetchGlassPosts(): Promise<GlassPost[]> {
    const cacheNS = (globalThis as { caches?: { default?: Cache } }).caches;
    const cache = cacheNS?.default;
    if (cache) {
        const hit = await cache.match(GLASS_URL).catch(() => undefined);
        if (hit) {
            const at = Number.parseInt(
                hit.headers.get("x-cached-at") ?? "0",
                10,
            );
            if (at && Date.now() - at < GLASS_TTL_MS) {
                return (await hit.json()) as GlassPost[];
            }
        }
    }
    try {
        const res = await fetch(GLASS_URL, {
            headers: {
                Accept: "application/json",
                "User-Agent": "iammatthias.com/1.0",
            },
        });
        if (!res.ok) return [];
        const body = await res.clone().arrayBuffer();
        if (cache) {
            const cacheable = new Response(body, {
                status: res.status,
                headers: res.headers,
            });
            cacheable.headers.set("x-cached-at", String(Date.now()));
            cacheable.headers.set(
                "Cache-Control",
                "public, max-age=86400, stale-while-revalidate=3600",
            );
            try {
                await cache.put(GLASS_URL, cacheable);
            } catch {
            }
        }
        return JSON.parse(new TextDecoder().decode(body)) as GlassPost[];
    } catch {
        return [];
    }
}

function fmtCaptureDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    });
}

export const GET: APIRoute = async () => {
    const posts = await fetchGlassPosts();
    const noPick = () =>
        new Response(null, {
            status: 204,
            headers: { "Cache-Control": "no-store" },
        });
    if (posts.length === 0) return noPick();
    const post = posts[Date.now() % posts.length];
    const featuredSrc = post.image1656x0 ?? post.image2048x2048 ?? null;
    if (!featuredSrc) return noPick();

    const alt =
        post.series?.title ??
        post.description?.trim() ??
        "Featured photograph";
    const exif = post.exif;
    const equipment = [exif?.camera, exif?.lens].filter(Boolean).join(" · ");
    const settings = [
        exif?.aperture,
        exif?.focal_length,
        exif?.exposure_time,
        exif?.iso ? `ISO ${exif.iso}` : null,
    ]
        .filter(Boolean)
        .join(" · ");
    const captureDate = exif?.date_time_original
        ? fmtCaptureDate(exif.date_time_original)
        : null;

    const payload = {
        src: wsrvUrl(featuredSrc, 960),
        srcset: wsrvSrcSet(featuredSrc, ARCH_WIDTHS),
        sizes: ARCH_SIZES,
        width: post.width ?? 720,
        height: post.height ?? 840,
        alt,
        prominentColor: post.prominent_color
            ? `#${post.prominent_color}`
            : null,
        seriesTitle: post.series?.title ?? null,
        shareUrl: post.share_url ?? null,
        equipment: equipment || null,
        settings: settings || null,
        captureDate,
    };

    return new Response(JSON.stringify(payload), {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control":
                "public, s-maxage=15, stale-while-revalidate=60",
        },
    });
};

export const HEAD = headFromGet(GET);
