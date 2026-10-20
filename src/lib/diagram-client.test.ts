import { describe, expect, test } from "bun:test";
import { playgroundUrl } from "./diagram-client";

describe("pele playground links", () => {
    test("carry the diagram source form-encoded in the fragment, as com-next builds them", () => {
        expect(playgroundUrl("flowchart LR\n  A[Web app] --> B")).toBe(
            "https://pele.run/playground#source=flowchart+LR%0A++A%5BWeb+app%5D+--%3E+B",
        );
    });

    test("escape characters that would end the fragment or split the parameter", () => {
        expect(playgroundUrl("A -->|a&b #1| B")).toBe("https://pele.run/playground#source=A+--%3E%7Ca%26b+%231%7C+B");
    });
});
