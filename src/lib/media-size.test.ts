import { describe, expect, test } from "bun:test";
import { mediaSize } from "./media-size";

describe("mediaSize", () => {
    test("real dimensions pass through", () => {
        expect(mediaSize({ width: 3000, height: 2000 })).toEqual({ width: 3000, height: 2000 });
    });

    test("width 0 is how blobs says unknown (uploads over 32 MiB, non-images)", () => {
        expect(mediaSize({ width: 0, height: 0 })).toEqual({ width: 960, height: 720 });
    });

    test("one missing side is as unknown as both", () => {
        expect(mediaSize({ width: 1200, height: 0 })).toEqual({ width: 960, height: 720 });
        expect(mediaSize({ width: 1200 })).toEqual({ width: 960, height: 720 });
    });

    test("no meta at all falls back", () => {
        expect(mediaSize(null)).toEqual({ width: 960, height: 720 });
        expect(mediaSize(undefined)).toEqual({ width: 960, height: 720 });
    });
});
