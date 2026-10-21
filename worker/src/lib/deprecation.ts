/**
 * A factual note on API versioning for /developers and developers.md. It
 * restates only what com already published (the /api/v1 aliases, the
 * API-Version header, and openapi.json's "Removals are announced at
 * /developers before they ship") and commits to no dates.
 */
export function versioningMarkdown(): string {
    return `## Versioning

The API is versioned under \`/api/v1\`: \`/api/v1/search.json\` and \`/api/v1/content.json\` are version-pinned aliases of the query endpoints, and every API response carries an \`API-Version\` header. Breaking changes will be announced here, in [/developers](/developers).
`;
}
