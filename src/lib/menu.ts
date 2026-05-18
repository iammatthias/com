/**
 * Frontmatter-driven menu metadata. Pages opt into the site menu by
 * exporting a `menu` constant matching this shape from their Astro
 * frontmatter:
 *
 *   export const menu: MenuMeta = {
 *     group: "personal",
 *     order: 1,
 *   };
 *
 * MenuLinks.astro discovers these via `import.meta.glob` at build
 * time — no manual list to maintain. Pages without a `menu` export
 * are excluded by default.
 */

export interface MenuMeta {
    /** Group label this page falls under, e.g. "archive" or "personal". */
    group: string;
    /**
     * Display label. Defaults to the page's URL slug. Use this to
     * override casing or formatting (e.g. "open source" not "open-source").
     */
    label?: string;
    /** Sort order within the group. Lower = first. Defaults to 0. */
    order?: number;
    /** Override the auto-derived URL. Rarely needed. */
    href?: string;
}

/**
 * Fixed group rendering order. Groups not in this list are appended
 * alphabetically. The empty string is the implicit "no group" / top
 * section (used for the home link).
 */
export const GROUP_ORDER = [
    "",
    "publications",
    "archive",
    "personal",
    "other",
];
