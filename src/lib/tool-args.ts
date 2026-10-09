export function boundedInt(
    value: unknown,
    bounds: { min: number; max: number; fallback: number },
): number {
    if (value === undefined || value === null || value === "") return bounds.fallback;
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return bounds.fallback;
    return Math.min(bounds.max, Math.max(bounds.min, Math.trunc(n)));
}

export function isJsonRpcNotification(body: Record<string, unknown>): boolean {
    return !("id" in body);
}

export function isJsonObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
