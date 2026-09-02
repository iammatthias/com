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

export function hashSeed(s: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
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
