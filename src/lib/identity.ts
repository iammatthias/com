// Single source of truth for who runs this site — consumed by the
// /now "Find me" list and by the JSON-LD Person entity (Schema.astro).
//
// The Person entity gives the site a stable @id, a consistent `sameAs`
// set pointing at every profile, and durable biographical facts, so
// crawlers can resolve "iammatthias" to one entity. Deliberately no
// Wikidata or Wikipedia component: that route needs third-party press
// for notability, which is not something a personal site can or should
// manufacture.

import { SITE_IDENTITY } from "./agent-surface";

export interface SocialLink {
    name: string;
    url: string;
    username: string;
    /** Include in JSON-LD sameAs but hide from the /now "Find me" list. */
    schemaOnly?: boolean;
}

export const AUTHOR = {
    name: SITE_IDENTITY.owner,
    /** The handle everything else hangs off. */
    alternateName: "iammatthias",
    description:
        "Photographer and solutions engineer in Southern California, making things for an open and personal web.",
    /** Durable topics, matched to what the site actually publishes. */
    knowsAbout: [
        "photography",
        "software engineering",
        "generative art",
        "cooking",
    ],
};

export const SOCIAL_LINKS: SocialLink[] = [
    {
        name: "Glass",
        url: "https://glass.photo/iam",
        username: "@iam",
    },
    {
        name: "GitHub",
        url: "https://github.com/iammatthias",
        username: "@iammatthias",
    },
    {
        name: "LinkedIn",
        url: "https://linkedin.com/in/iammatthias",
        username: "@iammatthias",
    },
    {
        name: "Bluesky",
        url: "https://bsky.app/profile/iammatthias.com",
        username: "@iammatthias.com",
    },
    {
        name: "Farcaster",
        url: "https://farcaster.xyz/iammatthias",
        username: "@iammatthias",
    },
    {
        name: "Instagram",
        url: "https://instagram.com/iammatthias",
        username: "@iammatthias",
    },
];
