export function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    });
}

export function fmtDateLong(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    });
}

export function escapeAttr(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;");
}

export function escapeHtml(value: string): string {
    return escapeAttr(value).replace(/>/g, "&gt;");
}

export function latest(...stamps: Array<string | undefined>): Date {
    const times = stamps.map((s) => Date.parse(s ?? "")).filter(Number.isFinite);
    return times.length ? new Date(Math.max(...times)) : new Date();
}
