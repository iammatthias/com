/**
 * The contract between this Worker and the GPUI app (com-next/app).
 *
 * The app can only issue same-origin GET requests without custom headers,
 * so everything it needs is reachable as plain JSON:
 *
 *   GET /api/app/index              -> AppIndex
 *   GET /api/app/route?path=<path>  -> AppRoute (discriminated on `kind`)
 *   GET /api/app/ssr?path=<path>    -> AppSsr: the server-rendered fallback for a path
 *   GET /img/<cid>?w=<width>        -> image bytes (or the raw blob for video/audio)
 *
 * Every timestamp is an ISO-8601 string exactly as Farfield stores it.
 * `href` values are site-relative paths ("/posts/1779066375000-farfield"),
 * except `AppIndex.elsewhere[].href`, which are absolute external URLs.
 *
 * /api/app/route answers HTTP 200 with JSON for every kind, including
 * "notfound" and "redirect"; a non-200 means a bad `path` (400) or an
 * upstream failure (5xx).
 *
 * /img/<cid>:
 *   - raster images go through wsrv.nl; `w` snaps up to IMG_WIDTHS (omitted -> 1920)
 *   - `f=webp|jpg|png|avif` picks the output format (default webp)
 *   - video, audio, svg, gif, unknown blobs, or `?raw` stream the original
 *     from blobs.farfield.systems, with Range passthrough (206) for video
 *   - always `Access-Control-Allow-Origin: *` and immutable caching
 * `cid` values are Farfield content hashes (CIDv1, base32, lowercase); the
 * same cid always means the same bytes.
 *
 * Example payloads for every kind live in worker/fixtures/app-api/*.json,
 * captured from a live `wrangler dev` against real Farfield content.
 */

/** One entry of the timeline: a document or a feed note, as the spiral letters it. */
export interface AppTimelineItem {
    title: string;
    href: string;
    /** the publication's slug, or "feed" */
    kind: string;
    /** ISO time it was published (a note: created) */
    at: string;
}

/** GET /api/app/timeline?page=N : everything, every kind together, newest first. */
export interface AppTimeline {
    items: AppTimelineItem[];
    page: number;
    pages: number;
    total: number;
}

/** GET /api/app/index */
export interface AppIndex {
    /** Publications that have at least one published document, in Farfield order. */
    sections: AppSection[];
    /** Every published document, newest first. */
    items: AppItem[];
    /** The 20 most recent feed posts, newest first. */
    feed: AppFeedSummary[];
    /** Profiles elsewhere (Glass, GitHub, ...), for the about/contact chrome. */
    elsewhere: AppLink[];
    /**
     * Exactly the groups and order com's /menu shows. `group` is "" for the
     * unlabeled first group (home); then publications, archive, personal, other.
     */
    menu: AppMenuGroup[];
    /** The 3 newest feed posts in full (com's home feed column). */
    latestFeed: AppPost[];
    /** com's home GlassArch hero: one recent glass.photo post. null when glass.photo is down or slow (>1s). */
    glassPick: AppGlassPick | null;
    /** com's home intro as markdown: two paragraphs, no heading. */
    intro: string;
}

export interface AppMenuGroup {
    group: string;
    links: AppLink[];
}

/**
 * The home hero photograph. Picked by time from the 25 newest glass.photo
 * posts, so consecutive index requests can differ.
 */
export interface AppGlassPick {
    /** The post on glass.photo (share_url), or the Glass profile when the post has none. */
    href: string;
    /** Absolute image URL (wsrv.nl-resized glass CDN image, 960w webp, CORS-enabled). */
    image: string;
    width?: number;
    height?: number;
    /** "#rrggbb" tint com paints behind the arch, when Glass has one. Additive. */
    prominentColor?: string;
    caption: {
        /** The post's description on Glass (com uses it only as alt text). */
        title?: string;
        /** Series title: the linked caption line com shows. */
        series?: string;
        /** "camera · lens" */
        equipment?: string;
        /** "aperture · focal length · exposure · ISO n" */
        settings?: string;
        /** Capture date, "May 4, 2024". */
        date?: string;
    };
}

export interface AppSection {
    slug: string;
    name: string;
    description: string | null;
    /** Published documents in this section. */
    count: number;
}

export interface AppItem {
    title: string;
    href: string;
    /** Section slug, e.g. "posts". */
    section: string;
    publishedAt: string;
    /** Farfield excerpt, or the first ~200 chars of plain body text. */
    excerpt: string;
    tags: string[];
    cid: string;
}

export interface AppFeedSummary {
    rkey: string;
    href: string;
    /** First ~200 chars of plain text, "" for media-only posts. */
    excerpt: string;
    createdAt: string;
}

export interface AppLink {
    label: string;
    href: string;
}

/** Blob metadata for one cid. Fetch pixels from `/img/<cid>?w=`. */
export interface AppMedia {
    /** e.g. "image/jpeg", "video/quicktime", "audio/mpeg"; "application/octet-stream" when Farfield has no metadata. */
    mime: string;
    /** Intrinsic size; null when Farfield has no dimensions (non-images). */
    width: number | null;
    height: number | null;
    /** "#rrggbb" or null. */
    dominantColor: string | null;
    blurhash: string | null;
    /** For video: a still frame blob to use as a poster. */
    thumbCid: string | null;
}

/** Map of cid -> metadata, for every blob a body references directly or through a series. */
export type AppMediaMap = Record<string, AppMedia>;

export type SeriesLayout = "grid" | "flow" | "triptych";

/**
 * A series embedded with `![](series://<slug>)`. `body` is the raw series
 * markdown (blob:// image lines and, for flow/triptych, text paragraphs).
 *
 * - "grid":     images only. Adjacent still + video pairs form live tiles.
 * - "flow":     images interleaved with text paragraphs, rendered in order.
 * - "triptych": the `phosphene` layout: image pair, then stanza text, then caption.
 */
export interface AppSeries {
    title: string | null;
    body: string;
    layout: SeriesLayout;
}

export type AppSeriesMap = Record<string, AppSeries>;

export interface AppRelated {
    title: string;
    href: string;
    /** Section slug. */
    section: string;
    /** The Farfield description; omitted when empty (com's FeedCard shows nothing then). */
    description?: string;
    publishedAt?: string;
}

export interface AppNeighbor {
    title: string;
    href: string;
}

export interface AppDoc {
    title: string;
    section: { slug: string; name: string };
    rkey: string;
    cid: string;
    /**
     * Key a parse/render cache on this, not `cid`: an edit to an embedded
     * series (or to the section's name/description) leaves `cid` unchanged.
     * Exactly com's renderKey(doc):
     * `<cid>@<publishedAt>@<updatedAt>[@<slug>:<seriesCid>,...]@<section name>|<section description>`.
     * Opaque; compare for equality only.
     */
    renderKey: string;
    href: string;
    publishedAt: string;
    updatedAt: string;
    tags: string[];
    /** Farfield excerpt, or the first 180 chars of body text. */
    description: string;
    readingMinutes: number;
    /**
     * The RAW body markdown exactly as stored in Farfield: `<ff-*>` component
     * tags, `blob://<cid>` and `series://<slug>` embeds, and ```recipe fences
     * are all left untouched for the app to render natively.
     */
    markdown: string;
    media: AppMediaMap;
    series: AppSeriesMap;
    /** Up to 6 documents ranked by shared tags, then recency. */
    related: AppRelated[];
    /** The next-older document in the same section. */
    prev?: AppNeighbor;
    /** The next-newer document in the same section. */
    next?: AppNeighbor;
}

export interface AppPost {
    rkey: string;
    cid: string;
    /**
     * Cache key for the rendered post: `cid`, or `<cid>@<slug>:<seriesCid>,...`
     * when it embeds a series (com's renderId for feed posts). Opaque.
     */
    renderKey: string;
    href: string;
    /** Raw feed markdown, same conventions as AppDoc.markdown. */
    body: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    media: AppMediaMap;
    series: AppSeriesMap;
}

export interface AppHomeRoute {
    kind: "home";
}

export interface AppDocRoute {
    kind: "doc";
    doc: AppDoc;
}

/** A section listing, paginated 12 per page. `page` is 1-based. */
export interface AppListRoute {
    kind: "list";
    section: AppSection;
    page: number;
    pages: number;
    items: AppItem[];
}

/** The feed stream, paginated 12 per page. */
export interface AppFeedRoute {
    kind: "feed";
    page: number;
    pages: number;
    /** Feed posts across every page. */
    total: number;
    posts: AppPost[];
}

export interface AppPostRoute {
    kind: "post";
    post: AppPost;
}

export interface AppTagsRoute {
    kind: "tags";
    /** Sorted by count desc, then tag asc. Tags keep their original case. */
    tags: Array<{ tag: string; count: number }>;
    /** Unique tags (tags.length). */
    total: number;
}

export interface AppTagRoute {
    kind: "tag";
    tag: string;
    page: number;
    pages: number;
    /** Documents with this tag across every page. */
    total: number;
    items: AppItem[];
}

/**
 * A hand-written page (about, contact, privacy, menu). `markdown` is plain CommonMark + GFM tables; it
 * has no ff-* tags or blob:// embeds. It starts with the page's `# Title`.
 */
export interface AppPageRoute {
    kind: "page";
    slug: string;
    title: string;
    markdown: string;
}

/** /now: com's now.astro. */
export interface AppNowRoute {
    kind: "now";
    title: "Now";
    /** The four bio paragraphs (the first, "Hi, I am Matthias.", com sets large italic). */
    bio: string;
    /** The "Working on" list, as a markdown list. */
    working: string;
    /** The 5 newest feed posts in full. */
    recent: AppPost[];
    /** com shows "<label> <username>" with the username muted; `username` is additive. */
    findMe: Array<{ label: string; href: string; username: string }>;
}

/** /resume: com's resume.astro, three sections each a <dl> of company / date / position. */
export interface AppResumeRoute {
    kind: "resume";
    title: "Resume";
    sections: Array<{
        title: string;
        entries: Array<{ company: string; date: string; position: string; href?: string }>;
    }>;
}

/** /developers: com's developers.astro. */
export interface AppDevelopersRoute {
    kind: "developers";
    /** The <h1>: "iammatthias.com developer documentation". */
    title: string;
    lede: string;
    /** "/developers.md" */
    markdownHref: string;
    /** The Quickstart <pre> text (shell, no fence). */
    quickstart: string;
    /** The "HTTP endpoints" <dl>: label "GET <path>", href the path. */
    endpoints: Array<{ label: string; href: string; description: string }>;
    /**
     * In com's order after the endpoint list: "HTTP endpoints" (the paragraph
     * under the list), "MCP server", "Markdown twins", "Versioning", "Everything
     * else", "Caching and etiquette", "FAQ". Versioning and FAQ are the twin's
     * additions (com carries the FAQ only as JSON-LD).
     */
    sections: Array<{ title: string; body: string }>;
}

/** All content across sections, paginated 12 per page. */
export interface AppContentRoute {
    kind: "content";
    page: number;
    pages: number;
    /** Published documents across every page. */
    total: number;
    /** Every live publication in Farfield order (com lists them all, even empty ones), with its document count. */
    sections: Array<{ slug: string; name: string; count: number }>;
    items: AppItem[];
}

/**
 * The path moved. `to` is a site-relative path (query preserved). Follow it
 * by replacing history state and re-requesting /api/app/route?path=<to>.
 */
export interface AppRedirectRoute {
    kind: "redirect";
    to: string;
    status: 301 | 302;
}

export interface AppNotFoundRoute {
    kind: "notfound";
}

export type AppRoute =
    | AppHomeRoute
    | AppDocRoute
    | AppListRoute
    | AppFeedRoute
    | AppPostRoute
    | AppTagsRoute
    | AppTagRoute
    | AppPageRoute
    | AppNowRoute
    | AppResumeRoute
    | AppDevelopersRoute
    | AppContentRoute
    | AppRedirectRoute
    | AppNotFoundRoute;

export type AppRouteKind = AppRoute["kind"];

/**
 * GET /api/app/ssr?path=<path>
 *
 * What the Worker's HTML response for `path` puts in the document, so the app
 * can keep the hidden SSR DOM in sync after in-app navigation: set
 * `document.title`, the description/canonical/og:* tags, and replace the
 * contents of `<main id="ssr">` with `html`.
 *
 * Answers HTTP 200 for every path, like /api/app/route: a moved path is the
 * same AppRedirectRoute, and an unknown one is an AppSsrPage whose `status`
 * is 404 (with the 404 page's html).
 */
export interface AppSsrPage {
    kind: "ssr";
    /** The HTTP status the HTML route answers with (200 or 404). */
    status: number;
    /** The full <title> text, e.g. "Farfield — iammatthias". */
    title: string;
    /** <meta name="description">. */
    description: string;
    /** <link rel="canonical"> href, absolute; null when the page is noindex and has none. */
    canonical: string | null;
    /** True when the page carries <meta name="robots" content="noindex,nofollow">. */
    noindex: boolean;
    og: {
        /** og:title (the page title without the site suffix). */
        title: string;
        /** og:description. */
        description: string;
        /** og:image, absolute. */
        image: string;
        /** og:url, absolute. */
        url: string;
        /** og:type. */
        type: "website" | "article";
    };
    /** Exactly the inner HTML of `<main id="ssr">` in the HTML response. */
    html: string;
}

export type AppSsr = AppSsrPage | AppRedirectRoute;

/** Width presets `/img/<cid>?w=` snaps up to (anything larger snaps to the last). */
export const IMG_WIDTHS = [320, 480, 640, 720, 800, 960, 1280, 1600, 1920, 2560] as const;
