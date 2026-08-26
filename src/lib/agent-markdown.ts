// Markdown bodies for the agent-facing root documents (/index.md,
// /llms.md, /auth.md, /pricing.md, /developers.md). Kept together so
// the story they tell stays consistent, and generated from
// agent-surface.ts so URLs can't go stale.

import {
    AGENT_RESOURCES,
    AGENT_SKILLS,
    API_OPERATIONS,
    SITE_IDENTITY,
    SITE_ORIGIN,
} from "./agent-surface";
import { listContent, listSections } from "./agent-data";

/**
 * Frontmatter block for a served markdown document. Agents read this
 * as metadata instead of scraping the body for a title.
 */
function frontMatter(fields: {
    title: string;
    description: string;
    canonical: string;
}): string {
    return [
        "---",
        `title: ${JSON.stringify(fields.title)}`,
        `description: ${JSON.stringify(fields.description)}`,
        `canonical: ${fields.canonical}`,
        `last-updated: ${new Date().toISOString().slice(0, 10)}`,
        "---",
        "",
    ].join("\n");
}

/** The homepage as markdown — what the site is, and how to use it. */
export async function homepageMarkdown(): Promise<string> {
    const sections = await listSections();
    const recent = await listContent({ limit: 10 });
    return `${frontMatter({
        title: `${SITE_IDENTITY.title} — site overview`,
        description: SITE_IDENTITY.summary,
        canonical: `${SITE_ORIGIN}/index.md`,
    })}# ${SITE_IDENTITY.title}

${SITE_IDENTITY.summary}

Maintained by ${SITE_IDENTITY.owner}. Canonical site: ${SITE_ORIGIN}

## What you can do here

Everything is public and free — no account, no API key, no rate-limit tier.

- **Read any page as markdown.** Append \`.md\` to any content URL (\`/posts/<slug>\` → \`/posts/<slug>.md\`).
- **Take the whole corpus in one fetch.** ${SITE_ORIGIN}/llms-full.txt
- **Search or query it.** JSON endpoints below, or the MCP server at ${SITE_ORIGIN}/mcp
- **Follow it.** RSS at ${SITE_ORIGIN}/rss.xml, per-section feeds at \`/<section>/rss.xml\`

## Sections

${sections.map((s) => `- **${s.slug}** — ${s.name}, ${s.entries} entries${s.description ? `. ${s.description}` : ""}. Index: ${SITE_ORIGIN}/${s.slug}.md`).join("\n")}

## Recent

${recent.map((i) => `- ${i.published.slice(0, 10)} [${i.title}](${i.markdownUrl})`).join("\n")}

## Machine-readable resources

${AGENT_RESOURCES.map((r) => `- [${r.name}](${r.url}) — ${r.description}`).join("\n")}

## HTTP endpoints

${API_OPERATIONS.map((o) => `- \`GET ${o.path}\` — ${o.summary}`).join("\n")}

Full specification: ${SITE_ORIGIN}/openapi.json · Notes: ${SITE_ORIGIN}/developers.md
`;
}

/**
 * The body of a 404 for a client that reads markdown. A dead end is
 * only useless if it doesn't say where to go instead.
 */
export function notFoundMarkdown(pathname: string): string {
    return `# 404 — no such page

There is nothing at \`${pathname}\` on ${SITE_IDENTITY.name}.

This is a genuine 404, not a soft error page: if you were crawling, that
path does not exist and never did.

## Where to look instead

- [Site index](${SITE_ORIGIN}/llms.txt) — every published entry, with markdown links
- [Whole corpus in one file](${SITE_ORIGIN}/llms-full.txt) — one request, no crawling
- [Sitemap](${SITE_ORIGIN}/sitemap.xml) — every indexable URL with last-modified dates
- [Developer documentation](${SITE_ORIGIN}/developers.md) — HTTP, GraphQL, and MCP surfaces
- [Search](${SITE_ORIGIN}/api/search.json?q=YOUR+TERMS) — keyword search returning JSON

## Common mistakes

- Content lives under a section: \`/posts/<slug>\`, \`/art/<slug>\`, \`/recipes/<slug>\`
- Append \`.md\` to any content URL for its markdown twin
- Slugs are timestamped, e.g. \`/posts/1779066375000-farfield\` — get exact paths from the site index above
`;
}

/** /auth.md — the honest walkthrough for a site with no auth. */
export function authMarkdown(): string {
    return `${frontMatter({
        title: "Authentication — iammatthias.com",
        description:
            "How agents authenticate with iammatthias.com: they don't. Everything is public and anonymous.",
        canonical: `${SITE_ORIGIN}/auth.md`,
    })}# Authentication

There is no authentication. Every endpoint, page, feed, and MCP tool on ${SITE_IDENTITY.name} is public and anonymous.

## Discover

Machine-readable descriptions of this site live at:

- ${SITE_ORIGIN}/.well-known/oauth-protected-resource — RFC 9728 metadata, declaring no authorization servers and no required scopes
- ${SITE_ORIGIN}/.well-known/ai-catalog.json — every agentic resource this site publishes
- ${SITE_ORIGIN}/openapi.json — the HTTP API surface
- ${SITE_ORIGIN}/.well-known/mcp/server-card.json — the MCP server and its tools

## Pick a method

None to pick. Send a plain request. Do not send an \`Authorization\` header; it is ignored.

\`\`\`
curl ${SITE_ORIGIN}/api/search.json?q=cloudflare
\`\`\`

## Register

No registration. There is no \`register_uri\` because there is no credential to register for. Identity type: \`anonymous\`.

## Claim and use a credential

Not applicable — no credential exists to claim, present, or refresh.

## Errors

Requests fail only on their own merits, never on identity. Errors are RFC 9457 problem documents (\`application/problem+json\`) carrying \`code\`, \`detail\`, and a \`resolution\` string that says how to fix and retry. You will never receive a \`401\` or a \`WWW-Authenticate\` challenge from this site.

## Revocation

Nothing to revoke.

## Etiquette

Identify yourself with a descriptive \`User-Agent\`. Prefer \`/llms-full.txt\` (one request for the whole corpus) over crawling page by page. Cache by the \`cid\` field — it is a content hash, so an unchanged \`cid\` means unchanged bytes.
`;
}

/** /pricing.md — "free" stated in the machine-readable place agents look. */
export function pricingMarkdown(): string {
    return `# Pricing

Free. There is nothing to buy on ${SITE_IDENTITY.name}, and no paid tier exists.

| Tier | Price | Limits | Auth |
| --- | --- | --- | --- |
| Public | $0 | Cloudflare's default edge rate limits | None |

## What that covers

- Every page, in HTML and markdown
- The full corpus at ${SITE_ORIGIN}/llms-full.txt
- All JSON endpoints listed in ${SITE_ORIGIN}/openapi.json
- The MCP server at ${SITE_ORIGIN}/mcp

## Terms

This is a personal site, not a commercial service. There is no SLA, no support contract, and no uptime guarantee — it is one Worker in front of a homelab.

Content (writing, photographs, generative art) is © ${SITE_IDENTITY.owner}, all rights reserved. Quoting with attribution and a link to the canonical URL is welcome; republishing whole works or training on the photography archive is not.

Questions: ${SITE_IDENTITY.email}
`;
}

/** /developers.md contains the human-and-agent readable API notes. */
export async function developersMarkdown(): Promise<string> {
    const sections = await listSections();
    return `${frontMatter({
        title: "iammatthias.com developer documentation: API, GraphQL & MCP",
        description:
            "HTTP endpoints, GraphQL, the MCP server, markdown twins, error shapes, and caching for iammatthias.com. Public, free, and no key required.",
        canonical: `${SITE_ORIGIN}/developers.md`,
    })}# Developer notes

${SITE_IDENTITY.name} makes its content available in machine-readable form. It is public and free. There is no account, API key, or paid tier. See ${SITE_ORIGIN}/auth.md and ${SITE_ORIGIN}/pricing.md.

## Quickstart

\`\`\`bash
# Search the site
curl "${SITE_ORIGIN}/api/search.json?q=cloudflare+workers"

# List one section
curl "${SITE_ORIGIN}/api/content.json?section=recipes"

# Read one document as markdown
curl "${SITE_ORIGIN}/posts/1779066375000-farfield.md"

# The whole corpus in a single request
curl "${SITE_ORIGIN}/llms-full.txt"
\`\`\`

## HTTP endpoints

${API_OPERATIONS.map(
    (o) =>
        `### \`GET ${o.path}\`\n\n${o.description}\n\n${
            o.params?.length
                ? o.params
                      .map(
                          (p) =>
                              `- \`${p.name}\`${p.required ? " (required)" : ""}: ${p.description}`,
                      )
                      .join("\n")
                : "No parameters."
        }`,
).join("\n\n")}

The full OpenAPI 3.1 specification is at ${SITE_ORIGIN}/openapi.json.

## MCP server

The MCP server uses Streamable HTTP at \`${SITE_ORIGIN}/mcp\`. It does not require authentication. Tools:

${AGENT_SKILLS.map((s) => `- \`${s.name}\`: ${s.description}`).join("\n")}

Add it to a client that speaks MCP:

\`\`\`json
{ "mcpServers": { "iammatthias": { "url": "${SITE_ORIGIN}/mcp" } } }
\`\`\`

Preview the tools without connecting: ${SITE_ORIGIN}/.well-known/mcp/server-card.json

## Markdown twins

Every content URL has a markdown twin at the same path plus \`.md\`. It includes front matter with the title, section, dates, tags, \`cid\`, and canonical \`html:\` URL. The \`blob://\` and \`series://\` embeds resolve to public image URLs.

Section indexes are at ${sections.map((s) => `\`/${s.slug}.md\``).join(", ")}. Each section has scoped context at \`/<section>/llms.txt\`.

## Errors

Errors are RFC 9457 problem documents. Each one has \`code\`, \`detail\`, and a \`resolution\` that says how to retry:

\`\`\`json
{
  "type": "${SITE_ORIGIN}/developers#missing_query",
  "status": 400,
  "code": "missing_query",
  "detail": "The 'q' parameter is required and must not be empty.",
  "resolution": "Retry with a query, e.g. /api/search.json?q=cloudflare+workers."
}
\`\`\`

## Test environment

There is no separate sandbox. Every endpoint is read-only. Requests cannot
create, modify, or delete anything, so production is safe to use directly.
You can retry requests and run them in CI. There is no key to obtain and no
quota to use.

For a fixed test dataset instead of live content, use
${SITE_ORIGIN}/llms-full.txt. It is one immutable-per-build snapshot of the
whole corpus.

## Caching

Every record has a \`cid\`, which is a CIDv1 content hash. The same \`cid\` means the same bytes, forever. Cache against it and skip unchanged documents.

## Source

The source is at ${SITE_IDENTITY.repo}.
`;
}
