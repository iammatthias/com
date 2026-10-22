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
    test("every page carries the one social loop as og:video, its own card staying the poster", () => {
        const card = "https://og.iammatthias.com/og/539c7dab52db089c707e7e6f.jpg?kind=page&seed=1";
        for (const html of [headHtml({ path: "/" }), headHtml({ path: "/posts/hello", title: "Hello", description: "A post." }, card)]) {
            expect(html).toContain(
                `<meta property="og:video" content="https://iammatthias.com/og-v1/loop.mp4">\n` +
                    `<meta property="og:video:secure_url" content="https://iammatthias.com/og-v1/loop.mp4">\n` +
                    `<meta property="og:video:type" content="video/mp4">\n` +
                    `<meta property="og:video:width" content="1200">\n` +
                    `<meta property="og:video:height" content="630">`,
            );
            expect(html).not.toContain("twitter:player");
        }
        expect(headHtml({ path: "/posts/hello", title: "Hello" }, card)).toContain(`<meta property="og:image" content="${card.replace("&", "&amp;")}">`);
    });
});
