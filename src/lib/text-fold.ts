const UNDECOMPOSED: Record<string, string> = {
    ø: "o",
    æ: "ae",
    œ: "oe",
    ł: "l",
    đ: "d",
    ð: "d",
    þ: "th",
    ß: "ss",
    ı: "i",
};

const UNDECOMPOSED_RE = new RegExp(`[${Object.keys(UNDECOMPOSED).join("")}]`, "g");

export function fold(s: string): string {
    return s
        .normalize("NFKD")
        .replace(/\p{M}+/gu, "")
        .toLowerCase()
        .replace(UNDECOMPOSED_RE, (c) => UNDECOMPOSED[c]);
}

export function words(s: string): string[] {
    return fold(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}
