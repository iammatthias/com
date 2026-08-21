// GraphQL endpoint over the site's content.
//
// Introspection is deliberately public: this is public content, and a
// schema an agent can't introspect is a schema it can't use. GET with
// ?query= works for cheap exploration; POST is the normal path.
//
// Cost control is by shape rather than a token budget — `first` caps
// at 100 per connection, nesting is shallow (there are no recursive
// relationships to explode), and `body` resolution is opt-in per
// document. Documented in /developers.md so an agent knows the limits
// before it hits them.

export const prerender = false;

import type { APIRoute } from "astro";
import { graphql, getIntrospectionQuery, validateSchema } from "graphql";
import { schema } from "@lib/graphql-schema";

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

async function run(
    query: string,
    variables?: Record<string, unknown>,
    operationName?: string,
) {
    const result = await graphql({
        schema,
        source: query,
        variableValues: variables,
        operationName,
    });
    // GraphQL reports request-level failures in `errors`; our schema
    // also models expected failures as types (see DocumentResult), so
    // a well-formed "not found" arrives as data, not an error.
    return json(result, result.errors && !result.data ? 400 : 200);
}

export const OPTIONS: APIRoute = () =>
    new Response(null, { status: 204, headers: CORS });

export const GET: APIRoute = async ({ url }) => {
    const query = url.searchParams.get("query");
    if (!query) {
        // No query: describe the endpoint rather than erroring, so a
        // browser or a probing agent learns what this is.
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
                                resolution:
                                    "URL-encode a JSON object, e.g. variables=%7B%22first%22%3A5%7D.",
                            },
                        },
                    ],
                },
                400,
            );
        }
    }
    return run(query, variables, url.searchParams.get("operationName") ?? undefined);
};

export const POST: APIRoute = async ({ request }) => {
    let body: {
        query?: string;
        variables?: Record<string, unknown>;
        operationName?: string;
    };
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
                            resolution:
                                'POST a JSON object shaped {"query": "...", "variables": {}}.',
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
};

/** Exported for the build-time SDL dump (see src/pages/schema.graphql.ts). */
export { getIntrospectionQuery };
