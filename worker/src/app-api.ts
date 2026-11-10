export interface AppTimelineItem {
    title: string;
    href: string;
    kind: string;
    at: string;
}

export interface AppTimeline {
    items: AppTimelineItem[];
    page: number;
    pages: number;
    total: number;
}

export interface AppIndex {
    sections: AppSection[];
    items: AppItem[];
    feed: AppFeedSummary[];
    elsewhere: AppLink[];
    menu: AppMenuGroup[];
    latestFeed: AppPost[];
    glassPick: AppGlassPick | null;
    intro: string;
}

export interface AppMenuGroup {
    group: string;
    links: AppLink[];
}

export interface AppGlassPick {
    href: string;
    image: string;
    width?: number;
    height?: number;
    prominentColor?: string;
    caption: {
        title?: string;
        series?: string;
        equipment?: string;
        settings?: string;
        date?: string;
    };
}

export interface AppSection {
    slug: string;
    name: string;
    description: string | null;
    count: number;
}

export interface AppItem {
    title: string;
    href: string;
    section: string;
    publishedAt: string;
    excerpt: string;
    tags: string[];
    cid: string;
}

export interface AppFeedSummary {
    rkey: string;
    href: string;
    excerpt: string;
    createdAt: string;
}

export interface AppLink {
    label: string;
    href: string;
}

export interface AppMedia {
    mime: string;
    width: number | null;
    height: number | null;
    dominantColor: string | null;
    blurhash: string | null;
    thumbCid: string | null;
}

export type AppMediaMap = Record<string, AppMedia>;

export type SeriesLayout = "grid" | "flow" | "triptych";

export interface AppSeries {
    title: string | null;
    body: string;
    layout: SeriesLayout;
}

export type AppSeriesMap = Record<string, AppSeries>;

export interface AppRelated {
    title: string;
    href: string;
    section: string;
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
    renderKey: string;
    href: string;
    publishedAt: string;
    updatedAt: string;
    tags: string[];
    description: string;
    readingMinutes: number;
    markdown: string;
    media: AppMediaMap;
    series: AppSeriesMap;
    related: AppRelated[];
    prev?: AppNeighbor;
    next?: AppNeighbor;
}

export interface AppPost {
    rkey: string;
    cid: string;
    renderKey: string;
    href: string;
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

export interface AppListRoute {
    kind: "list";
    section: AppSection;
    page: number;
    pages: number;
    items: AppItem[];
}

export interface AppFeedRoute {
    kind: "feed";
    page: number;
    pages: number;
    total: number;
    posts: AppPost[];
}

export interface AppPostRoute {
    kind: "post";
    post: AppPost;
}

export interface AppTagsRoute {
    kind: "tags";
    tags: Array<{ tag: string; count: number }>;
    total: number;
}

export interface AppTagRoute {
    kind: "tag";
    tag: string;
    page: number;
    pages: number;
    total: number;
    items: AppItem[];
}

export interface AppPageRoute {
    kind: "page";
    slug: string;
    title: string;
    markdown: string;
}

export interface AppNowRoute {
    kind: "now";
    title: "Now";
    bio: string;
    working: string;
    recent: AppPost[];
    findMe: Array<{ label: string; href: string; username: string }>;
}

export interface AppResumeRoute {
    kind: "resume";
    title: "Resume";
    sections: Array<{
        title: string;
        entries: Array<{ company: string; date: string; position: string; href?: string }>;
    }>;
}

export interface AppDevelopersRoute {
    kind: "developers";
    title: string;
    lede: string;
    markdownHref: string;
    quickstart: string;
    endpoints: Array<{ label: string; href: string; description: string }>;
    sections: Array<{ title: string; body: string }>;
}

export interface AppContentRoute {
    kind: "content";
    page: number;
    pages: number;
    total: number;
    sections: Array<{ slug: string; name: string; count: number }>;
    items: AppItem[];
}

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

export interface AppSsrPage {
    kind: "ssr";
    status: number;
    title: string;
    description: string;
    canonical: string | null;
    noindex: boolean;
    og: {
        title: string;
        description: string;
        image: string;
        url: string;
        type: "website" | "article";
    };
    html: string;
}

export type AppSsr = AppSsrPage | AppRedirectRoute;

export const IMG_WIDTHS = [320, 480, 640, 720, 800, 960, 1280, 1600, 1920, 2560] as const;
