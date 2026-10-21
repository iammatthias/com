import { describe, expect, test } from "bun:test";
import { parseContentEvents, tagsFor } from "../src/lib/revalidate";

describe("a deploy purges every page's HTML", () => {
    test("the deploy event maps to the shell tag", () => {
        const events = parseContentEvents({ kind: "deploy" });
        expect(events).not.toBeNull();
        expect(tagsFor(events!)).toEqual(["shell"]);
    });
    test("content events keep their tags", () => {
        expect(tagsFor(parseContentEvents([{ kind: "post" }, { kind: "entry" }])!)).toEqual(["documents", "feed-entries"]);
    });
});
