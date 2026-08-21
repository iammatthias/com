# iammatthias

A terminal reader and SDK for [iammatthias.com](https://iammatthias.com) — Matthias Jordan's personal site: photography, generative art, essays on building software, and recipes.

Everything the site publishes is public and unauthenticated. There is no account, no API key, and no paid tier.

## Use it without installing

```bash
npx iammatthias                  # browse interactively
npx iammatthias search "workers" # ranked search
npx iammatthias read posts/1779066375000-farfield
npx iammatthias random           # read something at random
```

## Commands

| Command | What it does |
| --- | --- |
| `iammatthias` | Interactive browser: pick a section, pick a piece, read it |
| `iammatthias search <terms>` | Ranked keyword search |
| `iammatthias read <path\|slug>` | Render one document in the terminal |
| `iammatthias list [section]` | List documents, optionally in one section |
| `iammatthias sections` | List publications with entry counts |
| `iammatthias random` | Read a random piece |

Respects `NO_COLOR`.

## As an SDK

```js
import { search, getDocument, listSections, graphql } from "iammatthias";

const hits = await search("cloudflare workers", { limit: 5 });
const markdown = await getDocument(hits[0].markdownUrl);

// Or query GraphQL directly
const { data } = await graphql(`
  { search(query: "pizza", first: 3) { nodes { title markdownUrl } } }
`);
```

Errors are `SiteError` instances carrying `code`, `status`, and a `resolution` string describing how to fix the request.

## For agents

The same content is available over MCP:

```json
{ "mcpServers": { "iammatthias": { "url": "https://iammatthias.com/mcp" } } }
```

Also: [`/llms.txt`](https://iammatthias.com/llms.txt) (index), [`/llms-full.txt`](https://iammatthias.com/llms-full.txt) (whole corpus in one fetch), [`/openapi.json`](https://iammatthias.com/openapi.json), [`/graphql`](https://iammatthias.com/graphql), and a markdown twin at any page URL plus `.md`.

Full notes: <https://iammatthias.com/developers>

## License

MIT for this package. Site content is © Matthias Jordan — quoting with attribution is welcome, republishing whole works is not.
