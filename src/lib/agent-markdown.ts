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
import { LICENSE_NETWORK, LICENSE_PRICE_USDC } from "./licensing";

/** The homepage as markdown — what the site is, and how to use it. */
export async function homepageMarkdown(): Promise<string> {
    const sections = await listSections();
    const recent = await listContent({ limit: 10 });
    return `# ${SITE_IDENTITY.title}

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

/** /auth.md — the honest walkthrough for a site with no auth. */
export function authMarkdown(): string {
    return `# Authentication

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

/** /pricing.md — free to read; licences are the one paid thing. */
export function pricingMarkdown(): string {
    return `# Pricing

Reading this site is free. There is no account, no API key, and no paid tier for content.

| What | Price | Limits | Auth |
| --- | --- | --- | --- |
| All content, feeds, APIs, MCP | $0 | Cloudflare's default edge rate limits | None |
| Image usage licence | $${LICENSE_PRICE_USDC} USDC | One licence per image | Payment only (MPP / x402) |

## Free

- Every page, in HTML and markdown
- The full corpus at ${SITE_ORIGIN}/llms-full.txt
- All JSON endpoints in ${SITE_ORIGIN}/openapi.json, plus GraphQL
- The MCP server at ${SITE_ORIGIN}/mcp

## Paid: image usage licences

Photographs and generative work in the art section can be licensed for
$${LICENSE_PRICE_USDC} USDC on ${LICENSE_NETWORK.name}, paid over MPP (x402 clients work too).

**What you are buying is the right to use the image, not access to it.** The
files are publicly reachable without paying, and always will be. A licence
grants you permission to use one commercially, plus a signed record proving
it — which is what matters if you or your client need to be legally clean.

- Catalogue and prices: ${SITE_ORIGIN}/api/license.json
- Terms: ${SITE_ORIGIN}/license
- Buy: \`GET ${SITE_ORIGIN}/api/license/<id>\` — returns HTTP 402 with payment details
- Verify a licence: \`POST ${SITE_ORIGIN}/api/license/verify\`

Editorial and personal use, perpetual, non-exclusive, attribution required. No
resale, no sublicensing, no AI training. Full terms at ${SITE_ORIGIN}/license.

## Terms

This is a personal site, not a commercial service. There is no SLA, no support
contract, and no uptime guarantee — it is one Worker in front of a homelab.

Content is © ${SITE_IDENTITY.owner}, all rights reserved except as licensed above.
Quoting with attribution and a link to the canonical URL is welcome.

Questions: ${SITE_IDENTITY.email}
`;
}

/** /license.md — the licensing terms, machine-readable. */
export function licenseMarkdown(): string {
    return `# Image licensing

Photographs and generative work in the art section of ${SITE_IDENTITY.name} can be
licensed for $${LICENSE_PRICE_USDC} USDC on ${LICENSE_NETWORK.name}, paid over MPP (x402 clients also work).

## What you are buying

Rights, not access. The image files are publicly reachable without payment and
always will be. This licence grants permission to *use* a specific image, plus a
signed record proving you hold that permission. Downloading a file is not a
licence; using it commercially without one is infringement regardless of how
easy the bytes were to obtain.

## Terms

- Scope: editorial and personal use
- Duration: perpetual
- Exclusivity: non-exclusive
- Attribution: required — credit ${SITE_IDENTITY.owner} with a link to the work's page
- Resale and sublicensing: not permitted
- AI training: not permitted (matches this site's \`Content-Signal: ai-train=no\`)

One licence covers one image. For exclusivity, print runs, whole series, or
training rights, email ${SITE_IDENTITY.email}.

## How to buy

\`\`\`bash
curl ${SITE_ORIGIN}/api/license.json          # catalogue
curl ${SITE_ORIGIN}/api/license/<id>          # 402 with payment details
npx mppx ${SITE_ORIGIN}/api/license/<id>      # pay it
\`\`\`

## Verifying

POST the grant exactly as issued to ${SITE_ORIGIN}/api/license/verify. Any
alteration to the licence body invalidates the signature.

${LICENSE_NETWORK.testnet ? `## Testnet notice\n\nSettlement runs on ${LICENSE_NETWORK.name}, a test network. Licences issued now are real and verifiable, but the payment carries no real-world value.` : ""}
`;
}

/** /developers.md — the human-and-agent readable API notes. */
export async function developersMarkdown(): Promise<string> {
    const sections = await listSections();
    return `# Developer notes

${SITE_IDENTITY.name} publishes its content in machine-readable form. Everything here is public, unauthenticated, and free — see ${SITE_ORIGIN}/auth.md and ${SITE_ORIGIN}/pricing.md.

## Quickstart

\`\`\`bash
# Search the site
curl "${SITE_ORIGIN}/api/search.json?q=cloudflare+workers"

# List everything in one section
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
                              `- \`${p.name}\`${p.required ? " (required)" : ""} — ${p.description}`,
                      )
                      .join("\n")
                : "No parameters."
        }`,
).join("\n\n")}

Full OpenAPI 3.1 specification: ${SITE_ORIGIN}/openapi.json

## MCP server

Streamable HTTP at \`${SITE_ORIGIN}/mcp\`. No authentication. Tools:

${AGENT_SKILLS.map((s) => `- \`${s.name}\` — ${s.description}`).join("\n")}

Add it to a client that speaks MCP:

\`\`\`json
{ "mcpServers": { "iammatthias": { "url": "${SITE_ORIGIN}/mcp" } } }
\`\`\`

Preview it without connecting: ${SITE_ORIGIN}/.well-known/mcp/server-card.json

## Markdown twins

Every content URL has a markdown twin at the same path plus \`.md\`, carrying front matter (title, section, dates, tags, \`cid\`, canonical \`html:\` URL) with \`blob://\` and \`series://\` embeds resolved to public image URLs.

Section indexes: ${sections.map((s) => `\`/${s.slug}.md\``).join(", ")}. Scoped context per section: \`/<section>/llms.txt\`.

## Errors

Errors are RFC 9457 problem documents with \`code\`, \`detail\`, and a \`resolution\` telling you how to retry:

\`\`\`json
{
  "type": "${SITE_ORIGIN}/developers#missing_query",
  "status": 400,
  "code": "missing_query",
  "detail": "The 'q' parameter is required and must not be empty.",
  "resolution": "Retry with a query, e.g. /api/search.json?q=cloudflare+workers."
}
\`\`\`

## Caching

Every record carries a \`cid\` — a CIDv1 content hash. Same \`cid\`, same bytes, forever. Cache against it and skip refetching unchanged documents.

## Source

The site is open source: ${SITE_IDENTITY.repo}
`;
}
