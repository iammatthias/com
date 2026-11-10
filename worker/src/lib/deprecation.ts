export function versioningMarkdown(): string {
    return `## Versioning

The API is versioned under \`/api/v1\`: \`/api/v1/search.json\` and \`/api/v1/content.json\` are version-pinned aliases of the query endpoints, and every API response carries an \`API-Version\` header. Breaking changes will be announced here, in [/developers](/developers).
`;
}
