import { describe, expect, test } from "bun:test";
import { humanize, isStampedSlug, slugify, unstampSlug } from "./slugs";

describe("slugify", () => {
    test("lowercases and collapses punctuation runs to single hyphens", () => {
        expect(slugify("  Hello,   World!  ")).toBe("hello-world");
        expect(slugify("100 Days of Code")).toBe("100-days-of-code");
    });

    test("trims any run of leading or trailing hyphens", () => {
        expect(slugify("---a---")).toBe("a");
        expect(slugify("-b")).toBe("b");
    });

    test("accented letters fold to their base letter instead of breaking the word", () => {
        expect(slugify("Crème Brûlée (two ways)")).toBe("creme-brulee-two-ways");
        expect(slugify("Passionfruit purée")).toBe("passionfruit-puree");
    });

    test("symbols with no letter in them still collapse to a hyphen", () => {
        expect(slugify("Scalability → Buildability")).toBe("scalability-buildability");
    });

    test("nothing sluggable yields the empty string", () => {
        expect(slugify("")).toBe("");
        expect(slugify("!!!")).toBe("");
    });
});

describe("stamped slugs", () => {
    test("a stamp is thirteen or more leading digits followed by a hyphen", () => {
        expect(isStampedSlug("1731955749292-pure-internet")).toBe(true);
        expect(isStampedSlug("17319557492920-x")).toBe(true);
    });

    test("shorter numeric prefixes and bare stamps are not stamps", () => {
        expect(isStampedSlug("173195574929-x")).toBe(false);
        expect(isStampedSlug("100-days-of-code")).toBe(false);
        expect(isStampedSlug("1731955749292")).toBe(false);
    });

    test("unstamp strips exactly one leading stamp", () => {
        expect(unstampSlug("1731955749292-pure-internet")).toBe("pure-internet");
        expect(unstampSlug("pure-internet")).toBe("pure-internet");
        expect(unstampSlug("1731955749292-1731955749292-x")).toBe(
            "1731955749292-x",
        );
    });
});

describe("humanize", () => {
    test("title-cases hyphenated slugs", () => {
        expect(humanize("now-playing")).toBe("Now Playing");
        expect(humanize("posts")).toBe("Posts");
    });
});

