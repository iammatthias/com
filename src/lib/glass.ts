import { wsrvUrl, wsrvSrcSet } from "@lib/farfield";
import { ARCH_WIDTHS, ARCH_SIZES } from "@lib/images";

export interface GlassPick {
    src: string;
    srcset: string;
    sizes: string;
    width: number;
    height: number;
    alt: string;
    prominentColor: string | null;
    seriesTitle: string | null;
    shareUrl: string | null;
    equipment: string | null;
    settings: string | null;
    captureDate: string | null;
}

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

export async function glassPick(): Promise<GlassPick | null> {
    const posts = await fetchGlassPosts();
    if (posts.length === 0) return null;
    const post = posts[Date.now() % posts.length];
    const featuredSrc = post.image1656x0 ?? post.image2048x2048 ?? null;
    if (!featuredSrc) return null;

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

    return {
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
}
