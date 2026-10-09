declare module "cloudflare:workers" {
    export const env: Record<string, unknown>;
    export abstract class WorkerEntrypoint<Env = unknown, Props = unknown> {
        protected env: Env;
        protected ctx: { props: Props; waitUntil(promise: Promise<unknown>): void };
    }
}

declare module "@astrojs/cloudflare/handler" {
    export function handle(
        request: Request,
        env: unknown,
        ctx: { waitUntil(promise: Promise<unknown>): void },
    ): Promise<Response>;
}

declare const __LAYOUT_FINGERPRINT__: string;

declare module "*.vert?raw" {
    const src: string;
    export default src;
}

declare module "*.frag?raw" {
    const src: string;
    export default src;
}
