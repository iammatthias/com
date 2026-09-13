import {
    GROUP_ORDER,
    getPublicationLinks,
    type MenuMeta,
    type PublicationLink as Link,
} from "./menu";

export interface MenuGroup {
    label?: string;
    links: Link[];
}

interface PageModule {
    menu?: MenuMeta;
}

const pageModules = import.meta.glob<PageModule>("/src/pages/**/*.astro");

function pathToHref(path: string): string | null {
    if (path.includes("[")) return null;
    const stripped = path
        .replace(/^\/src\/pages/, "")
        .replace(/\/index\.astro$/, "")
        .replace(/\.astro$/, "");
    return stripped || "/";
}

function deriveLabel(href: string): string {
    if (href === "/") return "home";
    const last = href.split("/").filter(Boolean).pop() ?? "";
    return last.replace(/-/g, " ");
}

export async function getMenuGroups(): Promise<MenuGroup[]> {
    const fromPages: { meta: MenuMeta; href: string }[] = [];
    const loaded = await Promise.all(
        Object.entries(pageModules).map(
            async ([path, load]) => [path, await load()] as const,
        ),
    );
    for (const [path, mod] of loaded) {
        if (!mod.menu) continue;
        const href = mod.menu.href ?? pathToHref(path);
        if (!href) continue;
        fromPages.push({ meta: mod.menu, href });
    }

    const publicationLinks = await getPublicationLinks();

    const groupMap = new Map<string, Link[]>();
    groupMap.set("", [{ href: "/", label: "home", order: 0 }]);

    for (const p of fromPages) {
        const link: Link = {
            href: p.href,
            label: p.meta.label ?? deriveLabel(p.href),
            order: p.meta.order ?? 0,
        };
        if (!groupMap.has(p.meta.group)) groupMap.set(p.meta.group, []);
        groupMap.get(p.meta.group)!.push(link);
    }

    if (publicationLinks.length > 0) {
        if (!groupMap.has("publications")) groupMap.set("publications", []);
        groupMap.get("publications")!.push(...publicationLinks);
    }

    const otherGroup = groupMap.get("other") ?? [];
    otherGroup.push({ href: "/rss.xml", label: "rss", order: 99 });
    groupMap.set("other", otherGroup);

    for (const links of groupMap.values()) {
        links.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
    }

    const knownGroups = new Set(GROUP_ORDER);
    const orderedGroupKeys = [
        ...GROUP_ORDER.filter((g) => groupMap.has(g)),
        ...[...groupMap.keys()]
            .filter((g) => !knownGroups.has(g))
            .sort((a, b) => a.localeCompare(b)),
    ];

    return orderedGroupKeys
        .map((key) => ({ label: key || undefined, links: groupMap.get(key) ?? [] }))
        .filter((g) => g.links.length > 0);
}
