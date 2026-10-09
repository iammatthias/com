const FALLBACK = { width: 960, height: 720 } as const;

export function mediaSize(
    meta: { width?: number; height?: number } | null | undefined,
): { width: number; height: number } {
    const width = meta?.width ?? 0;
    const height = meta?.height ?? 0;
    return width > 0 && height > 0 ? { width, height } : FALLBACK;
}
