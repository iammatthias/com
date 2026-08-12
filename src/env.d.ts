// Minimal declaration for the workerd runtime module — the project
// doesn't generate full worker types (`wrangler types`), and the only
// consumer (lib/runtime-env.ts) narrows the env shape structurally.
declare module "cloudflare:workers" {
    export const env: Record<string, unknown>;
}
