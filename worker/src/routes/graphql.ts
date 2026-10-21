import type { Ctx, Route } from "./context";
import {
    graphql,
    Kind,
    parse,
    printSchema,
    validateSchema,
    type DocumentNode,
    type FragmentDefinitionNode,
    type OperationDefinitionNode,
    type SelectionSetNode,
} from "graphql";
import { schema } from "../lib/graphql-schema";

/** Ported from com/src/pages/graphql.ts and schema.graphql.ts. */

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(payload: unknown, status = 200) {
    return new Response(JSON.stringify(payload, null, 2), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
            ...CORS,
        },
    });
}

/** Every top-level field (alias) resolves on its own: bounded so one request can't fan out without end. */
const MAX_QUERY_LENGTH = 8 * 1024;
const MAX_ROOT_FIELDS = 10;

/** Fields at the operation's root, through fragments; spreads of unknown fragments count nothing. */
function rootFieldCount(doc: DocumentNode, operationName?: string): number {
    const ops = doc.definitions.filter((d): d is OperationDefinitionNode => d.kind === Kind.OPERATION_DEFINITION);
    const op = operationName ? ops.find((o) => o.name?.value === operationName) : ops[0];
    if (!op) return 0;
    const fragments = new Map(
        doc.definitions
            .filter((d): d is FragmentDefinitionNode => d.kind === Kind.FRAGMENT_DEFINITION)
            .map((f) => [f.name.value, f]),
    );
    const seen = new Set<string>();
    const count = (set: SelectionSetNode): number =>
        set.selections.reduce((n, s) => {
            if (s.kind === Kind.FIELD) return n + 1;
            if (s.kind === Kind.INLINE_FRAGMENT) return n + count(s.selectionSet);
            const frag = fragments.get(s.name.value);
            if (!frag || seen.has(frag.name.value)) return n;
            seen.add(frag.name.value);
            return n + count(frag.selectionSet);
        }, 0);
    return count(op.selectionSet);
}

/** Why `query` is refused before it runs, or null. A syntax error is left to graphql() to report. */
export function queryLimitError(query: string, operationName?: string): string | null {
    if (query.length > MAX_QUERY_LENGTH) return `The query is longer than ${MAX_QUERY_LENGTH} characters.`;
    let doc: DocumentNode;
    try {
        doc = parse(query);
    } catch {
        return null;
    }
    const fields = rootFieldCount(doc, operationName);
    return fields > MAX_ROOT_FIELDS ? `The query asks for ${fields} top-level fields; the limit is ${MAX_ROOT_FIELDS}.` : null;
}

async function run(query: string, variables?: Record<string, unknown>, operationName?: string) {
    const limit = queryLimitError(query, operationName);
    if (limit) {
        return json(
            {
                errors: [
                    {
                        message: limit,
                        extensions: {
                            code: "QUERY_TOO_LARGE",
                            resolution: `Split the query into requests of at most ${MAX_ROOT_FIELDS} top-level fields and ${MAX_QUERY_LENGTH} characters.`,
                        },
                    },
                ],
            },
            400,
        );
    }
    const result = await graphql({ schema, source: query, variableValues: variables, operationName });
    return json(result, result.errors && !result.data ? 400 : 200);
}

function options(): Response {
    return new Response(null, { status: 204, headers: CORS });
}

async function get({ url }: Ctx): Promise<Response> {
    const query = url.searchParams.get("query");
    if (!query) {
        const problems = validateSchema(schema);
        return json({
            endpoint: "https://iammatthias.com/graphql",
            description:
                "Read-only GraphQL over the published content of iammatthias.com. Public, unauthenticated, introspection enabled.",
            usage: {
                get: "/graphql?query={sections{slug entryCount}}",
                post: 'POST {"query":"...","variables":{}}',
            },
            limits: {
                connectionFirstMax: 100,
                queryLengthMax: MAX_QUERY_LENGTH,
                topLevelFieldsMax: MAX_ROOT_FIELDS,
                note: "Request `body` only on documents you intend to read; it resolves image embeds per document.",
            },
            schemaValid: problems.length === 0,
            introspection: "/graphql?query=" + encodeURIComponent("{__schema{types{name}}}"),
            documentation: "https://iammatthias.com/developers.md",
        });
    }
    const variablesRaw = url.searchParams.get("variables");
    let variables: Record<string, unknown> | undefined;
    if (variablesRaw) {
        try {
            variables = JSON.parse(variablesRaw);
        } catch {
            return json(
                {
                    errors: [
                        {
                            message: "The 'variables' parameter is not valid JSON.",
                            extensions: {
                                code: "INVALID_ARGUMENT",
                                resolution: "URL-encode a JSON object, e.g. variables=%7B%22first%22%3A5%7D.",
                            },
                        },
                    ],
                },
                400,
            );
        }
    }
    return run(query, variables, url.searchParams.get("operationName") ?? undefined);
}

async function post({ request }: Ctx): Promise<Response> {
    let body: { query?: string; variables?: Record<string, unknown>; operationName?: string };
    try {
        body = await request.json();
    } catch {
        return json(
            {
                errors: [
                    {
                        message: "Request body is not valid JSON.",
                        extensions: {
                            code: "INVALID_ARGUMENT",
                            resolution: 'POST a JSON object shaped {"query": "...", "variables": {}}.',
                        },
                    },
                ],
            },
            400,
        );
    }
    if (!body.query) {
        return json(
            {
                errors: [
                    {
                        message: "Missing 'query'.",
                        extensions: {
                            code: "INVALID_ARGUMENT",
                            resolution:
                                'Include a query string, e.g. {"query":"{sections{slug}}"}. Introspect with the standard introspection query.',
                        },
                    },
                ],
            },
            400,
        );
    }
    return run(body.query, body.variables, body.operationName);
}

function sdl(): Response {
    return new Response(printSchema(schema), {
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
    });
}

export const graphqlRoutes: Route[] = [
    { methods: ["OPTIONS"], pattern: /^\/graphql$/, handler: options },
    { methods: ["GET", "HEAD"], pattern: /^\/graphql$/, handler: get },
    { methods: ["POST"], pattern: /^\/graphql$/, handler: post },
    { methods: ["GET", "HEAD"], pattern: /^\/schema\.graphql$/, handler: sdl },
];
