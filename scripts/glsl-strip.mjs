/**
 * Strip comments, indentation and blank lines from GLSL ES 1.00 source.
 *
 * Whitespace and comments carry no meaning in GLSL, so this is
 * semantics-preserving. It is safe here specifically because the azulejo
 * shader has no backslash line-continuations and no `//` trailing live code —
 * both are asserted in glsl-strip.test.mjs.
 */
export function stripGlsl(src) {
    return src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/[^\n]*/g, "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .join("\n");
}
