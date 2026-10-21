import { SITE_IDENTITY, SITE_ORIGIN, AGENT_SKILLS, AGENT_RESOURCES, API_OPERATIONS, CONTENT_SIGNAL, EXAMPLE_DOC_PATH } from "../lib/agent-surface";
import { SOCIAL_LINKS } from "../lib/identity";
import { loadAllFeedEntries, livePublications } from "../lib/farfield-loader";
import { publishedDocs } from "../lib/content-query";
import { plainText } from "../lib/markdown-text";
import { fmtDate } from "../lib/format";
import { versioningMarkdown } from "../lib/deprecation";

/**
 * The old site's hand-written Astro pages, as markdown. The copy is carried
 * over verbatim; only the markup changed. The same markdown feeds the SSR
 * HTML under the canvas, the app's `page` route, and the `.md` twins.
 */
export interface StaticPage {
    slug: string;
    title: string;
    description: string;
    markdown: () => Promise<string>;
    profilePage?: boolean;
    noindex?: boolean;
    faq?: Array<{ question: string; answer: string }>;
    markdownHref?: string;
    ogImage?: string;
    edgeCached?: boolean;
}

const socials = SOCIAL_LINKS.filter((l) => !l.schemaOnly);

const about: StaticPage = {
    slug: "about",
    title: "About",
    description:
        "Matthias Jordan is a photographer and solutions engineer in Southern California. This is his personal archive.",
    profilePage: true,
    markdown: async () => `# About

I'm Matthias Jordan. I'm a photographer and solutions engineer in Southern California. This site is my cozy corner of the web. It is an archive, not a portfolio. Nothing here is for sale.

Photography comes first. I make long exposures of the ocean, aerial and drone work in California, Hawaii, and Baja, and snapshots with film cameras and my iPhone. I also make generative experiments trained on my own images. Some work is collected into series with process notes. Some is just a photograph and a date.

For work, I'm a solutions engineer. I also build things for the web. That includes AT Protocol tools, Cloudflare Workers, small AI hardware projects, and Farfield. Farfield is the self-hosted, content-addressed backend serving this site. I write about what I build, including the parts that do not work.

I cook, too. The recipes here are things I actually make. They use the tabular format from *Cooking for Engineers*, with ingredients on the left and each step running across the page.

I want a web that's open and personal. I own my data, make handmade sites, and build in the open. There is no account to make and no newsletter to join. This is simply where I keep my work.

## Elsewhere

${socials.map((l) => `- [${l.name}](${l.url}): ${l.username}`).join("\n")}

## This site

Built in Rust with GPUI, drawn to a WebGPU canvas, and served by a Cloudflare Worker reading a self-hosted Farfield backend. Content is content-addressed, every page has a markdown twin, and the whole thing is open source. See [developers](/developers) for the machine-readable surfaces, or [now](/now) for what I'm up to lately.
`,
};

const contact: StaticPage = {
    slug: "contact",
    title: "Contact",
    description:
        "How to reach Matthias Jordan — email, social profiles, and what to expect.",
    markdown: async () => `# Contact

Email is best: [${SITE_IDENTITY.email}](mailto:${SITE_IDENTITY.email}). I read everything, and I answer most things within a week or so. If something here was useful to you, or wrong, I'd genuinely like to know — corrections to posts are welcome and I'll credit them.

Good reasons to write: you have a question about something I built or photographed, you spotted an error, you want to use a photograph and want to ask first, or you're working on something adjacent and want to compare notes.

Things I'll politely decline: guest posts, link exchanges, SEO offers, sponsored content, and anything that starts by telling me my website has problems. I don't take advertising and this site has no commercial relationships to disclose.

## Social

Messages on these reach me too, though slower than email:

${socials.map((l) => `- [${l.name}](${l.url}) — ${l.username}`).join("\n")}

## For agents

If you're an automated client: everything published here is already available without asking. See [developers](/developers) for the JSON endpoints and the MCP server, [auth.md](/auth.md) (there is no authentication), and [pricing.md](/pricing.md) (it's free). Use the email above for permission questions about reusing photography.
`,
};

const privacy: StaticPage = {
    slug: "privacy",
    title: "Privacy",
    description: "One cookie, cookieless page counts, no tracking, no accounts.",
    markdown: async () => `# Privacy

One cookie remembers that you've seen the greeting. Page views are counted without cookies. Nothing else tracks you, and there are no accounts.

Your settings and searches stay in your browser.

The work here is mine. Ask before republishing it.

Questions: [${SITE_IDENTITY.email}](mailto:${SITE_IDENTITY.email})
`,
};

export const DEVELOPERS_FAQ = [
    {
        question: "Does the iammatthias.com API require authentication?",
        answer: "No. Every endpoint, feed, and MCP tool is public and anonymous. Do not send an Authorization header; it is ignored.",
    },
    {
        question: "What does the iammatthias.com API cost?",
        answer: "Nothing. There is no account, no API key, and no paid tier. Rate limits are Cloudflare's edge defaults.",
    },
    {
        question: "Does iammatthias.com have an MCP server?",
        answer: `Yes, at https://iammatthias.com/mcp over Streamable HTTP with no authentication. It exposes ${AGENT_SKILLS.map((s) => s.name).join(", ")}.`,
    },
    {
        question: "How do I get a page from iammatthias.com as markdown?",
        answer: "Append .md to any content URL. The whole corpus is available in one request at https://iammatthias.com/llms-full.txt.",
    },
    {
        question: "Can I use content from iammatthias.com for AI training?",
        answer: `No. The site's Content-Signal policy is ${CONTENT_SIGNAL}. Quoting with attribution and a link to the canonical URL is welcome.`,
    },
];

/** The /developers page's pieces, shared by the app's `developers` payload, the SSR HTML, and this markdown. */
export const DEVELOPERS_HEADING = "iammatthias.com developer documentation";

export const DEVELOPERS_LEDE =
    "This site makes its content available in machine-readable form. It is public and free. There is no account, API key, or paid tier.";

export const DEVELOPERS_QUICKSTART = `# Search the site
curl "${SITE_ORIGIN}/api/search.json?q=cloudflare+workers"

# List one section
curl "${SITE_ORIGIN}/api/content.json?section=recipes"

# Read a document as markdown
curl "${SITE_ORIGIN}/${EXAMPLE_DOC_PATH}.md"

# The whole corpus in one request
curl "${SITE_ORIGIN}/llms-full.txt"`;

export function developersEndpoints(): Array<{ label: string; href: string; description: string }> {
    return API_OPERATIONS.map((op) => ({ label: `GET ${op.path}`, href: op.path, description: op.description }));
}

/** Every section after the endpoint list, in com's order; Versioning and FAQ are the twin's additions. */
export function developersSections(): Array<{ title: string; body: string }> {
    return [
        {
            title: "HTTP endpoints",
            body: "The full specification is at [openapi.json](/openapi.json). Errors are RFC 9457 problem documents. Each one has a `resolution` field that says how to retry.",
        },
        {
            title: "MCP server",
            body: `The MCP server uses Streamable HTTP at \`${SITE_ORIGIN}/mcp\`. It does not require authentication. Add it to any MCP client:

\`\`\`json
{ "mcpServers": { "iammatthias": { "url": "${SITE_ORIGIN}/mcp" } } }
\`\`\`

${AGENT_SKILLS.map((s) => `- \`${s.name}\`: ${s.description}`).join("\n")}

Preview the tools without connecting: [server-card.json](/.well-known/mcp/server-card.json).`,
        },
        {
            title: "Markdown twins",
            body: "Every content URL has a markdown twin at the same path plus `.md`. It includes front matter with the title, dates, tags, content hash, and canonical URL. Images resolve to public URLs. Section indexes are at `/<section>.md`. Each section has scoped context at `/<section>/llms.txt`.",
        },
        {
            title: "Versioning",
            body: versioningMarkdown().replace(/^## Versioning\n\n/, "").trim(),
        },
        {
            title: "Everything else",
            body: AGENT_RESOURCES.map((r) => `- [${r.name}](${r.url}): ${r.description}`).join("\n"),
        },
        {
            title: "Caching and etiquette",
            body: "Every record has a `cid`, which is a CIDv1 content hash. The same cid means the same bytes, forever. Cache against it instead of fetching the record again. Prefer [llms-full.txt](/llms-full.txt) to crawling page by page. Send a descriptive `User-Agent`. The source is at [github.com/iammatthias/com](https://github.com/iammatthias/com).",
        },
        {
            title: "FAQ",
            body: DEVELOPERS_FAQ.map((f) => `**${f.question}**\n\n${f.answer}`).join("\n\n"),
        },
    ];
}

const developers: StaticPage = {
    slug: "developers",
    title: "iammatthias.com developer documentation: API, GraphQL & MCP",
    description:
        "JSON endpoints, an MCP server, markdown twins, and the full iammatthias.com corpus in one file. Public, free, and no key required.",
    markdownHref: "/developers.md",
    faq: DEVELOPERS_FAQ,
    markdown: async () => {
        const [endpointsNote, ...rest] = developersSections();
        return `# ${DEVELOPERS_HEADING}

${DEVELOPERS_LEDE}

[this page as markdown](/developers.md)

## Quickstart

\`\`\`bash
${DEVELOPERS_QUICKSTART}
\`\`\`

## HTTP endpoints

${API_OPERATIONS.map((op) => `- \`GET ${op.path}\`: ${op.description}`).join("\n")}

${endpointsNote.body}

${rest.map((sec) => `## ${sec.title}\n\n${sec.body}\n`).join("\n")}`;
    },
};

export const RESUME = [
    {
        section: "Present",
        entries: [
            { date: "2026 → Current", company: "Stablecore", position: "Solutions Engineer" },
            {
                date: "Since I first picked up a camera until the day I die",
                company: "Photographer",
                position: "Fine art & freelance",
            },
        ],
    },
    {
        section: "Historic",
        entries: [
            { date: "2025 → 2026", company: "Pinata", position: "Developer Relations" },
            { date: "2024 → 2026", company: "day---break", position: "Owner" },
            {
                date: "2023 → 2024",
                company: "Ice Barrel (Contractor)",
                position: "Web Development & Performance Marketing Manager",
            },
            { date: "2022 → 2024", company: "Opul (Contractor)", position: "Design System Engineer" },
            { date: "2021 → 2022", company: "Tornado", position: "Growth Engineer" },
            { date: "2018 → 2021", company: "Aspiration", position: "CRM Architect" },
            { date: "2016 → 2018", company: "Surf Air", position: "Product & Marketing Coordinator" },
        ],
    },
    {
        section: "Education",
        entries: [
            {
                date: "2010 → 2014",
                company: "Brooks Institute",
                position: "Bachelors Degree, Commercial Photography",
            },
        ],
    },
];

const resume: StaticPage = {
    slug: "resume",
    title: "Resume",
    description: "Professional experience and education history",
    ogImage: "/resume",
    markdown: async () =>
        `# Resume\n\n` +
        RESUME.map(
            (s) =>
                `## ${s.section}\n\n` +
                s.entries
                    .map((e) => `- **${e.company}** — ${e.position}  \n  ${e.date}`)
                    .join("\n"),
        ).join("\n\n") +
        "\n",
};

export const NOW_RECENT_LIMIT = 5;

/** com now.astro's bio section, one paragraph per line of copy. */
export const NOW_BIO = `Hi, I am Matthias.

I'm a photographer who builds software. Most of what I build is for me, and some of it turns out to be useful for other people too.

This site is my cozy corner of the web. I want a web that's open and personal, so everything here lives on infrastructure I run. You can keep up with my career on my [resume](/resume).

I live in Southern California. When I'm not at my desk I'm usually cooking or out with a camera.`;

export const NOW_WORKING = `- Solutions Engineer @ Stablecore
- Cooking [recipes](/recipes)
- Photographing [art](/art)`;

export const NOW_FIND_ME = socials.map((l) => ({ label: l.name, href: l.url, username: l.username }));

/** com index.astro's home intro (its <h1> and paragraph), as two markdown paragraphs. */
export const HOME_INTRO = `Hi, I am Matthias.

This is my cozy corner on the web. A collection of photographs, projects, recipes, and notes.`;

const now: StaticPage = {
    slug: "now",
    title: "Now",
    description: "What I'm working on right now.",
    ogImage: "/now",
    profilePage: true,
    edgeCached: true,
    markdown: async () => {
        const feed = (await loadAllFeedEntries().catch(() => [])).slice(0, NOW_RECENT_LIMIT);
        const updates = feed.length
            ? feed
                  .map((f) => {
                      const text = plainText(f.body).slice(0, 140).trim();
                      return `- [${fmtDate(f.createdAt)}](/feed/${f.rkey})${text ? `: ${text}` : ""}`;
                  })
                  .join("\n")
            : "Nothing recent.";
        return `# Now

${NOW_BIO}

## Working on

${NOW_WORKING}

## Recent updates

[see all →](/feed)

${updates}

## Find me

${NOW_FIND_ME.map((l) => `- [${l.label} ${l.username}](${l.href})`).join("\n")}
`;
    },
};

interface MenuLink {
    href: string;
    label: string;
    order: number;
}

export async function menuGroups(): Promise<Array<{ label?: string; links: MenuLink[] }>> {
    const [pubs, docs] = await Promise.all([
        livePublications().catch(() => []),
        publishedDocs().catch(() => []),
    ]);
    const withContent = new Set(docs.map((d) => d.collection));
    const sort = (links: MenuLink[]) =>
        links.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
    const groups: Array<{ label?: string; links: MenuLink[] }> = [
        { links: [{ href: "/", label: "home", order: 0 }] },
        {
            label: "publications",
            links: pubs
                .filter((p) => withContent.has(p.slug))
                .map((p, i) => ({ href: `/${p.slug}`, label: p.name.toLowerCase(), order: i })),
        },
        {
            label: "archive",
            links: sort([
                { href: "/content", label: "all content", order: 1 },
                { href: "/tags", label: "tags", order: 2 },
            ]),
        },
        {
            label: "personal",
            links: sort([
                { href: "/about", label: "about", order: 1 },
                { href: "/now", label: "now", order: 1 },
                { href: "/resume", label: "resume", order: 2 },
                { href: "/contact", label: "contact", order: 3 },
            ]),
        },
        {
            label: "other",
            links: sort([
                { href: "/developers", label: "developers", order: 3 },
                { href: "/privacy", label: "privacy", order: 4 },
                { href: "/rss.xml", label: "rss", order: 99 },
            ]),
        },
    ];
    return groups.filter((g) => g.links.length > 0);
}

const menu: StaticPage = {
    slug: "menu",
    title: "Menu",
    description: "Site navigation.",
    ogImage: "/menu",
    noindex: true,
    markdown: async () =>
        `# Menu\n\n` +
        (await menuGroups())
            .map(
                (g) =>
                    (g.label ? `## ${g.label}\n\n` : "") +
                    g.links.map((l) => `- [${l.label}](${l.href})`).join("\n"),
            )
            .join("\n\n") +
        "\n",
};

export const STATIC_PAGES: Record<string, StaticPage> = Object.fromEntries(
    [about, contact, privacy, developers, resume, now, menu].map((p) => [p.slug, p]),
);

export const SOCIAL_HREFS = new Set(socials.map((l) => l.url));
