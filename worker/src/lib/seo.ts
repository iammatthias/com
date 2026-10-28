import { SITE_IDENTITY, SITE_ORIGIN } from "./agent-surface";
import { AUTHOR, SOCIAL_LINKS } from "./identity";
import { escapeAttr } from "./format";

/** Ported from com/src/layouts/BaseLayout.astro and components/Schema.astro. */

export interface Breadcrumb {
    label: string;
    href?: string;
}

export interface PageHead {
    title?: string;
    description?: string;
    ogImage?: string;
    ogType?: "website" | "article";
    /** Site-relative path used for canonical and og:url. */
    path: string;
    noindex?: boolean;
    breadcrumbs?: Breadcrumb[];
    article?: { publishedTime: string; modifiedTime?: string };
    profilePage?: boolean;
    markdownHref?: string;
    pagination?: { prev?: string | null; next?: string | null };
    faq?: Array<{ question: string; answer: string }>;
}

export const SITE_NAME = "iammatthias";
const OG_ORIGIN = "https://og.iammatthias.com";
/** The home plate looping (app/scripts/og-loop.ts), kept for a year under its versioned path, so
 *  a new look is a new -v path: the home's clip, and any page's that has no loop of its own. */
export const OG_VIDEO = { url: `${SITE_ORIGIN}/og-v1/loop.mp4`, path: "/og-v1/loop.mp4", type: "video/mp4", width: 1200, height: 630 };

export function fullTitle(head: PageHead): string {
    return head.title ? `${head.title} — ${SITE_NAME}` : SITE_NAME;
}

function jsonLd(head: PageHead, canonical: string, title: string, description: string, image: string): string {
    const origin = SITE_ORIGIN;
    const websiteId = `${origin}/#website`;
    const personId = `${origin}/#person`;
    const webpageId = `${canonical}#webpage`;
    const isHomepage = canonical === `${origin}/`;
    const { breadcrumbs = [], article, profilePage = false, faq = [] } = head;

    const graph: Record<string, unknown>[] = [
        {
            "@type": "WebSite",
            "@id": websiteId,
            url: `${origin}/`,
            name: SITE_NAME,
            publisher: { "@id": personId },
        },
        {
            "@type": "Person",
            "@id": personId,
            name: AUTHOR.name,
            alternateName: AUTHOR.alternateName,
            description: AUTHOR.description,
            knowsAbout: AUTHOR.knowsAbout,
            url: `${origin}/`,
            sameAs: SOCIAL_LINKS.map((l) => l.url),
        },
        {
            "@type": profilePage ? "ProfilePage" : "WebPage",
            "@id": webpageId,
            url: canonical,
            name: title,
            description,
            isPartOf: { "@id": websiteId },
            ...(isHomepage && { about: { "@id": personId } }),
            ...(profilePage && { mainEntity: { "@id": personId } }),
            ...(image && { image }),
            speakable: {
                "@type": "SpeakableSpecification",
                cssSelector: [".page-header h1", ".page-header p", ".intro", ".doc-hero"],
            },
            ...(article && {
                datePublished: article.publishedTime,
                ...(article.modifiedTime && { dateModified: article.modifiedTime }),
            }),
        },
    ];

    if (breadcrumbs.length > 0) {
        graph.push({
            "@type": "BreadcrumbList",
            "@id": `${canonical}#breadcrumbs`,
            itemListElement: [
                { "@type": "ListItem", position: 1, name: "home", item: `${origin}/` },
                ...breadcrumbs.map((crumb, i) => ({
                    "@type": "ListItem",
                    position: i + 2,
                    name: crumb.label,
                    ...(crumb.href && { item: `${origin}${crumb.href}` }),
                })),
            ],
        });
    }

    if (faq.length > 0) {
        graph.push({
            "@type": "FAQPage",
            "@id": `${canonical}#faq`,
            isPartOf: { "@id": webpageId },
            mainEntity: faq.map((f) => ({
                "@type": "Question",
                name: f.question,
                acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
        });
    }

    if (article) {
        graph.push({
            "@type": "BlogPosting",
            "@id": `${canonical}#article`,
            headline: title,
            description,
            url: canonical,
            mainEntityOfPage: { "@id": webpageId },
            author: { "@id": personId },
            publisher: { "@id": personId },
            datePublished: article.publishedTime,
            ...(article.modifiedTime && { dateModified: article.modifiedTime }),
            ...(image && { image }),
        });
    }

    return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(
        /</g,
        "\\u003c",
    );
}

/** The resolved values behind <title>, the description, canonical and og:* tags. */
export interface HeadMeta {
    /** The full <title> text. */
    title: string;
    description: string;
    /** Absolute canonical URL (also og:url). */
    canonical: string;
    noindex: boolean;
    ogTitle: string;
    ogImage: string;
    ogType: "website" | "article";
}

/** `card`: the page's social card (lib/og-card.ts), when there is one; else the old og.iammatthias.com image. */
export function headMeta(head: PageHead, card?: string): HeadMeta {
    const ogImage = card ?? head.ogImage ?? "/";
    return {
        title: fullTitle(head),
        description: head.description ?? SITE_IDENTITY.tagline,
        canonical: new URL(head.path, SITE_ORIGIN).toString(),
        noindex: Boolean(head.noindex),
        ogTitle: head.title ?? SITE_NAME,
        ogImage: (/^https?:\/\//i.test(ogImage) ? new URL(ogImage) : new URL(ogImage, OG_ORIGIN)).toString(),
        ogType: head.ogType ?? "website",
    };
}

/** Everything BaseLayout put in <head>, minus charset/viewport (the shell has them). `video`: the
 *  page's own loop (lib/og-card.ts cardVideoUrl), else the shared one. */
export function headHtml(head: PageHead, card?: string, video = OG_VIDEO.url): string {
    const { description, canonical, ogImage: ogImageURL, ogTitle } = headMeta(head, card);
    const a = escapeAttr;
    const tags: string[] = [
        `<meta name="color-scheme" content="light dark">`,
        `<meta name="theme-color" content="#F4EFE4" media="(prefers-color-scheme: light)">`,
        `<meta name="theme-color" content="#15120F" media="(prefers-color-scheme: dark)">`,
        `<meta name="description" content="${a(description)}">`,
        head.noindex
            ? `<meta name="robots" content="noindex,nofollow">`
            : `<meta name="robots" content="max-snippet:-1, max-image-preview:large, max-video-preview:-1"><link rel="canonical" href="${a(canonical)}">`,
        `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`,
        `<link rel="icon" href="/favicon.ico" sizes="32x32">`,
        `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`,
        `<link rel="manifest" href="/site.webmanifest">`,
        `<meta property="og:site_name" content="${SITE_NAME}">`,
        `<meta property="og:type" content="${headMeta(head).ogType}">`,
        `<meta property="og:url" content="${a(canonical)}">`,
        `<meta property="og:title" content="${a(ogTitle)}">`,
        `<meta property="og:description" content="${a(description)}">`,
        `<meta property="og:image" content="${a(ogImageURL)}">`,
        `<meta property="og:image:width" content="1200">`,
        `<meta property="og:image:height" content="630">`,
        `<meta property="og:image:alt" content="${a(ogTitle)}">`,
        `<meta property="og:video" content="${a(video)}">`,
        `<meta property="og:video:secure_url" content="${a(video)}">`,
        `<meta property="og:video:type" content="${OG_VIDEO.type}">`,
        `<meta property="og:video:width" content="${OG_VIDEO.width}">`,
        `<meta property="og:video:height" content="${OG_VIDEO.height}">`,
    ];
    if (head.article) {
        tags.push(`<meta property="article:published_time" content="${a(head.article.publishedTime)}">`);
        if (head.article.modifiedTime) {
            tags.push(`<meta property="article:modified_time" content="${a(head.article.modifiedTime)}">`);
        }
    }
    tags.push(
        `<meta name="twitter:card" content="summary_large_image">`,
        `<meta name="twitter:title" content="${a(ogTitle)}">`,
        `<meta name="twitter:description" content="${a(description)}">`,
        `<meta name="twitter:image" content="${a(ogImageURL)}">`,
        `<meta name="twitter:image:alt" content="${a(ogTitle)}">`,
        `<script type="application/ld+json">${jsonLd(head, canonical, ogTitle, description, ogImageURL)}</script>`,
        `<link rel="alternate" type="application/rss+xml" title="${SITE_NAME} RSS" href="/rss.xml">`,
        `<link rel="sitemap" type="application/xml" href="/sitemap.xml">`,
    );
    if (head.markdownHref) {
        tags.push(`<link rel="alternate" type="text/markdown" title="Markdown version" href="${a(head.markdownHref)}">`);
    }
    if (head.pagination?.prev) tags.push(`<link rel="prev" href="${a(head.pagination.prev)}">`);
    if (head.pagination?.next) tags.push(`<link rel="next" href="${a(head.pagination.next)}">`);
    return tags.join("\n");
}
