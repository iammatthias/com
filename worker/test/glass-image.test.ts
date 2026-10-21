import { describe, expect, test } from "bun:test";
import { glassImageUpstream } from "../src/routes/app";
import { wsrvUrl } from "../src/lib/farfield";
import worker from "../src/index";

const exec = { waitUntil() {}, passThroughOnException() {} };

const PICK =
    "https://wsrv.nl/?url=https%3A%2F%2Fcdn.glass.photo%2Fr6qELRosBSmpuI0tTKIzpVaHyclLN6lOagLc9uFqI3M%2Frs%3Afit%3A1656%3A0%3A0%2Fq%3A90%2FL3Bvc3QvOTc1Y2MzZjgtNjYwZi00MDI4LWI5ZTItODQ0YmFmZjc1NjA5L3Bob3Rv&w=960&q=80&output=webp";

describe("glass-image proxy", () => {
    test("a Glass pick passes through unchanged", () => {
        expect(glassImageUpstream(PICK)).toBe(PICK);
    });

    test("only wsrv.nl resizes of the Glass CDN, at the arch widths", () => {
        expect(glassImageUpstream(wsrvUrl("https://example.com/a.png", 960))).toBeNull();
        expect(glassImageUpstream(wsrvUrl("http://cdn.glass.photo/a", 960))).toBeNull();
        expect(glassImageUpstream(wsrvUrl("https://cdn.glass.photo.evil.com/a", 960))).toBeNull();
        expect(glassImageUpstream(wsrvUrl("https://cdn.glass.photo/a", 4000))).toBeNull();
        expect(glassImageUpstream(PICK.replace("wsrv.nl", "evil.com"))).toBeNull();
        expect(glassImageUpstream(PICK.replace("output=webp", "output=svg"))).toBeNull();
        expect(glassImageUpstream("not a url")).toBeNull();
    });

    test("parameters other than url, w and output never reach wsrv.nl", () => {
        const out = glassImageUpstream(`${PICK}&default=https%3A%2F%2Fexample.com%2F`)!;
        expect(new URL(out).searchParams.has("default")).toBe(false);
    });
});

describe("glass-image when wsrv.nl turns the Worker away", () => {
    const realFetch = globalThis.fetch;
    const ask = async (answer: (url: string) => Response) => {
        const asked: string[] = [];
        globalThis.fetch = (async (input: RequestInfo | URL) => {
            const url = String(input);
            asked.push(new URL(url).hostname);
            return answer(url);
        }) as typeof fetch;
        try {
            const res = await worker.fetch(new Request(`https://iammatthias.com/api/app/glass-image?src=${encodeURIComponent(PICK)}`), {} as never, exec as never);
            return { res, asked };
        } finally {
            globalThis.fetch = realFetch;
        }
    };
    const refused = () => new Response("error code: 1106\n", { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    const jpeg = () => new Response(new Uint8Array([0xff, 0xd8]), { headers: { "Content-Type": "image/jpeg" } });

    test("the photograph comes from Glass's own CDN", async () => {
        const { res, asked } = await ask((url) => (url.startsWith("https://wsrv.nl/") ? refused() : jpeg()));
        expect(res.status).toBe(200);
        expect(res.headers.get("Content-Type")).toBe("image/jpeg");
        expect(asked).toEqual(["wsrv.nl", "cdn.glass.photo"]);
    });

    test("and when neither answers, a 502 that isn't kept", async () => {
        const { res } = await ask(refused);
        expect(res.status).toBe(502);
        expect(res.headers.get("Cache-Control")).toBe("no-store");
    });
});
