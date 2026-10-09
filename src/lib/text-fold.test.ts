import { describe, expect, test } from "bun:test";
import { fold, words } from "./text-fold";

describe("fold", () => {
    test("accents and case fold away, so typed and published spellings meet", () => {
        expect(fold("Crème Brûlée")).toBe("creme brulee");
        expect(fold("Pokémon")).toBe("pokemon");
        expect(fold("Nazaré")).toBe("nazare");
        expect(fold("purée")).toBe(fold("PUREE"));
    });

    test("letters Unicode does not decompose are mapped by hand", () => {
        expect(fold("Bjørn")).toBe("bjorn");
        expect(fold("Straße")).toBe("strasse");
        expect(fold("Æsir œuvre Łódź")).toBe("aesir oeuvre lodz");
    });

    test("compatibility forms fold to their plain equivalents", () => {
        expect(fold("ﬁne")).toBe("fine");
        expect(fold("τ²")).toBe("τ2");
    });

    test("an already-plain string is unchanged", () => {
        expect(fold("cloudflare workers")).toBe("cloudflare workers");
    });
});

describe("words", () => {
    test("splits on anything that is not a letter or number, in any script", () => {
        expect(words("Crème brûlée, two ways!")).toEqual(["creme", "brulee", "two", "ways"]);
        expect(words("jalapeño-lime")).toEqual(["jalapeno", "lime"]);
        expect(words("cloudflare_workers")).toEqual(["cloudflare", "workers"]);
    });

    test("keeps non-Latin words whole", () => {
        expect(words("東京 タワー")).toEqual(["東京", "タワー"]);
        expect(words("Москва")).toEqual(["москва"]);
    });

    test("nothing in, nothing out", () => {
        expect(words("")).toEqual([]);
        expect(words(" — ")).toEqual([]);
    });
});
