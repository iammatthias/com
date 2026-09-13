const STAMPED_SLUG = /^\d{13,}-/;

export function slugify(s: string): string {
    return s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function isStampedSlug(slug: string): boolean {
    return STAMPED_SLUG.test(slug);
}

export function unstampSlug(rkey: string): string {
    return rkey.replace(STAMPED_SLUG, "");
}

export function humanize(slug: string): string {
    return slug
        .split("-")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(" ");
}
