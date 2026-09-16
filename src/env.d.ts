declare module "cloudflare:workers" {
    export const env: Record<string, unknown>;
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
