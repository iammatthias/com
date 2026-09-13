export const LAYOUT_FINGERPRINT = __LAYOUT_FINGERPRINT__;

export function pageCacheKey(contentKey: string): string {
    return `${LAYOUT_FINGERPRINT}|${contentKey}`;
}
