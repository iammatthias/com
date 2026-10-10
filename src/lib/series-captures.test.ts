import { describe, expect, test } from "bun:test";
import { groupCaptures, type SeriesMedia } from "./series-captures";

type Meta = { mime: string } | null;
const img = (cid: string): SeriesMedia<Meta> => ({ cid, alt: "", meta: { mime: "image/jpeg" } });
const mov = (cid: string): SeriesMedia<Meta> => ({ cid, alt: "", meta: { mime: "video/quicktime" } });
const unknown = (cid: string): SeriesMedia<Meta> => ({ cid, alt: "", meta: null });
const isVideo = (m: Meta) => (m?.mime ?? "").startsWith("video/");
const shape = (media: SeriesMedia<Meta>[]) =>
    groupCaptures(media, isVideo).map((c) =>
        c.kind === "live" ? `live:${c.still.cid}+${c.movie.cid}` : c.kind === "still" ? `still:${c.still.cid}` : `video:${c.movie.cid}`,
    );

describe("groupCaptures", () => {
    test("an image followed by a video is one live capture", () => {
        expect(shape([img("a"), mov("A")])).toEqual(["live:a+A"]);
    });

    test("an image followed by an image is two stills", () => {
        expect(shape([img("a"), img("b")])).toEqual(["still:a", "still:b"]);
    });

    test("an image at the end of the body is a still", () => {
        expect(shape([img("a"), mov("A"), img("b")])).toEqual(["live:a+A", "still:b"]);
    });

    test("a video with no image before it stands alone", () => {
        expect(shape([mov("A")])).toEqual(["video:A"]);
        expect(shape([img("a"), mov("A"), mov("B")])).toEqual(["live:a+A", "video:B"]);
    });

    test("classification is by meta, not by position parity", () => {
        expect(shape([img("a"), img("b"), mov("B"), img("c"), mov("C")])).toEqual(["still:a", "live:b+B", "live:c+C"]);
    });

    test("missing meta is treated as an image, never as a video", () => {
        expect(shape([unknown("a"), unknown("b")])).toEqual(["still:a", "still:b"]);
        expect(shape([unknown("a"), mov("A")])).toEqual(["live:a+A"]);
    });

    test("the live datamosh shape: pairs with lone stills between them", () => {
        expect(shape([img("1"), mov("1m"), img("2"), img("3"), img("4"), mov("4m")])).toEqual([
            "live:1+1m",
            "still:2",
            "still:3",
            "live:4+4m",
        ]);
    });

    test("nothing in, nothing out", () => {
        expect(shape([])).toEqual([]);
    });
});
