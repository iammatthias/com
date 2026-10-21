import { afterEach, describe, expect, test } from "bun:test";
import { cardImageUrl, cardSpec, signCard } from "../src/lib/og-card";
import { notFoundPage } from "../src/lib/ssr";
import { setRuntimeEnv } from "../src/lib/runtime-env";

const HOME = { kind: "home", eyebrow: "", title: "", description: "", seed: 0x5eed1234 };

afterEach(() => setRuntimeEnv(undefined));

describe("cardSpec", () => {
    test("a page gets its own card, seeded by its path", () => {
        expect(cardSpec({ path: "/posts/hello", title: "Hello", description: "A post.", breadcrumbs: [{ label: "posts", href: "/posts" }] })).toEqual({
            kind: "page",
            eyebrow: "posts",
            title: "Hello",
            description: "A post.",
            seed: 2088866794,
        });
    });

    test("the home page and every unindexed page share the home card", async () => {
        expect(cardSpec({ path: "/" })).toEqual(HOME);
        expect(cardSpec(notFoundPage("/no-such-page").head)).toEqual(HOME);
        expect(cardSpec({ path: "/menu", title: "Menu", noindex: true })).toEqual(HOME);
        expect(await signCard(cardSpec(notFoundPage("/one").head), "k")).toBe(await signCard(cardSpec(notFoundPage("/two").head), "k"));
    });

    test("bogus paths get the home card's URL, not one each", async () => {
        setRuntimeEnv({ OG_SIGNING_KEY: "k" });
        const home = await cardImageUrl({ path: "/" }, "https://iammatthias.com");
        expect(home).toMatch(/^https:\/\/og\.iammatthias\.com\/og\/[0-9a-f]{24}\.jpg\?kind=home&seed=1592594996$/);
        expect(await cardImageUrl(notFoundPage("/wp-admin").head, "https://iammatthias.com")).toBe(home!);
        expect(await cardImageUrl(notFoundPage("/.env").head, "https://iammatthias.com")).toBe(home!);
    });

    test("staging and local origins keep their cards on their own host", async () => {
        setRuntimeEnv({ OG_SIGNING_KEY: "k" });
        expect(await cardImageUrl({ path: "/" }, "http://127.0.0.1:8796")).toMatch(/^http:\/\/127\.0\.0\.1:8796\/og\/[0-9a-f]{24}\.jpg\?/);
    });
});
