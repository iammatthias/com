
import { SITE_IDENTITY } from "./agent-surface";

export interface SocialLink {
    name: string;
    url: string;
    username: string;
    schemaOnly?: boolean;
}

export const AUTHOR = {
    name: SITE_IDENTITY.owner,
    alternateName: "iammatthias",
    description:
        "Photographer and solutions engineer in Southern California, making things for an open and personal web.",
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
