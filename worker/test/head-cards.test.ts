import { describe, expect, test } from "bun:test";
import { headHtml } from "../src/lib/seo";

describe("social card tags", () => {
    test("X gets the same card, title and description as Open Graph", () => {
        const card = "https://og.iammatthias.com/og/539c7dab52db089c707e7e6f.jpg?kind=page&seed=1";
        const html = headHtml({ path: "/posts/hello", title: "Hello", description: "A post." }, card);
        expect(html).toContain(`<meta property="og:image" content="https://og.iammatthias.com/og/539c7dab52db089c707e7e6f.jpg?kind=page&amp;seed=1">`);
        expect(html).toContain(`<meta name="twitter:image" content="https://og.iammatthias.com/og/539c7dab52db089c707e7e6f.jpg?kind=page&amp;seed=1">`);
        expect(html).toContain(`<meta name="twitter:title" content="Hello">`);
        expect(html).toContain(`<meta name="twitter:description" content="A post.">`);
    });
});
