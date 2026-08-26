// One SKILL.md per advertised capability — the artifact the v0.2.0
// discovery index points at, so an agent can read what a skill does
// before opening a transport.

export const prerender = true;

import type { APIRoute, GetStaticPaths } from "astro";
import { AGENT_SKILLS, SITE_ORIGIN } from "@lib/agent-surface";
import { markdownResponse } from "@lib/agent-http";

export const getStaticPaths: GetStaticPaths = () =>
    AGENT_SKILLS.map((s) => ({ params: { skill: s.name }, props: { skill: s } }));

export const GET: APIRoute = ({ props }) => {
    const s = props.skill as (typeof AGENT_SKILLS)[number];
    return markdownResponse(
        `---
name: ${s.name}
title: ${s.title}
description: ${s.description}
protocol: mcp
endpoint: ${SITE_ORIGIN}/mcp
authentication: none
---

# ${s.title}

${s.description}

## How to call it

This skill is a tool on the site's MCP server. Connect to
\`${SITE_ORIGIN}/mcp\` (Streamable HTTP, no authentication) and call
\`${s.name}\` via \`tools/call\`. The tool's input schema comes back from
\`tools/list\`.

\`\`\`json
{ "mcpServers": { "iammatthias": { "url": "${SITE_ORIGIN}/mcp" } } }
\`\`\`

Everything this skill reads is public. See ${SITE_ORIGIN}/developers.md
for the equivalent HTTP and GraphQL surfaces.
`,
    );
};
