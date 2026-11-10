import { describe, expect, test } from "bun:test";
import { LexError, lexRust, lexTypescript, stripSource } from "./strip-comments.ts";

const ts = (source: string) => stripSource(source, "typescript").after;
const rs = (source: string) => stripSource(source, "rust").after;

describe("typescript", () => {
  test("a regex holding slashes is code, and a template's tail is not a new template", () => {
    expect(ts("a = /\\/\\//g; // hi\n`x${y}z` /* b */\n")).toBe("a = /\\/\\//g;\n`x${y}z`\n");
  });

  test("strings and templates keep their slashes", () => {
    expect(ts('const u = "https://x"; // c\n')).toBe('const u = "https://x";\n');
    expect(ts("const t = `https://${h}/x/*y*/${`//${z}`}`; /* gone */ f();\n")).toBe(
      "const t = `https://${h}/x/*y*/${`//${z}`}`; f();\n",
    );
  });

  test("a regex holding /* stays whole, division stays division", () => {
    expect(ts("const r = /a\\/*b/; // c\nx = a / b / c; // d\nconst q = (a) / b / c;\n")).toBe(
      "const r = /a\\/*b/;\nx = a / b / c;\nconst q = (a) / b / c;\n",
    );
    expect(ts("if (ok) /x\\/\\//.test(s); // c\n")).toBe("if (ok) /x\\/\\//.test(s);\n");
  });

  test("comment lines go, and the blank lines they leave collapse", () => {
    expect(ts("a();\n\n// one\n// two\n\nb();\n")).toBe("a();\n\nb();\n");
    expect(ts('// header\n\nimport x from "y";\n')).toBe('import x from "y";\n');
    expect(ts("function f() {\n  // why\n\n  return 1;\n}\n")).toBe("function f() {\n  return 1;\n}\n");
    expect(ts("/**\n * Doc.\n */\nexport const a = 1;\n")).toBe("export const a = 1;\n");
  });

  test("a mid-line comment leaves one space between tokens and none inside brackets", () => {
    expect(ts("f(/* a */ b, c /* d */ + e);\n")).toBe("f(b, c + e);\n");
    expect(ts("x = a/**/+b;\n")).toBe("x = a +b;\n");
  });

  test("a multi-line comment between tokens keeps its line break", () => {
    expect(ts("function f() {\n  return /*\n  */ 1;\n}\n")).toBe("function f() {\n  return\n1;\n}\n");
  });

  test("directives stay", () => {
    const { after, kept } = stripSource("#!/usr/bin/env bun\n// @ts-expect-error\nimport(/* @vite-ignore */ u); // x\n", "typescript");
    expect(after).toBe("#!/usr/bin/env bun\n// @ts-expect-error\nimport(/* @vite-ignore */ u);\n");
    expect(kept.map((c) => c.directive)).toEqual(["shebang", "ts pragma", "bundler hint"]);
  });

  test("a string holding // is not a comment", () => {
    expect(lexTypescript('const s = "a//b"; const r = /\\/\\*/;').comments).toEqual([]);
  });

  test("Bun's transpiler, the independent oracle, drops comments", () => {
    const transpile = (s: string) => new Bun.Transpiler({ loader: "ts", minifyWhitespace: true }).transformSync(s);
    expect(transpile("a(); // c\n/* d */ b();\n")).toBe(transpile("a();\nb();\n"));
    expect(transpile('a("//");\n')).not.toBe(transpile("a();\n"));
  });
});

describe("rust", () => {
  test("strings, raw strings and byte strings keep their slashes", () => {
    expect(rs('let u = "https://x"; // c\n')).toBe('let u = "https://x";\n');
    expect(rs('let r = r##"a "# // not"##; /* c */\n')).toBe('let r = r##"a "# // not"##;\n');
    expect(rs("let b = b\"//\"; let c = br#\"/*\"#; let d = b'\\''; let e = c\"x\"; // c\n")).toBe(
      "let b = b\"//\"; let c = br#\"/*\"#; let d = b'\\''; let e = c\"x\";\n",
    );
  });

  test("block comments nest", () => {
    expect(rs("/* a /* b */ still */ fn f() {}\n")).toBe("fn f() {}\n");
  });

  test("lifetimes are not char literals and chars hold quotes", () => {
    expect(rs("fn f<'a>(x: &'a str) -> char { '/' } // c\n")).toBe("fn f<'a>(x: &'a str) -> char { '/' }\n");
    expect(rs("let q = '\"'; let s = '\\''; let e = '😀'; let l = 'x: loop {}; // c\n")).toBe(
      "let q = '\"'; let s = '\\''; let e = '😀'; let l = 'x: loop {};\n",
    );
  });

  test("doc comments of every kind go", () => {
    expect(rs("//! Crate.\n\n/// Item.\n/** Block doc. */\n/*! Inner. */\nfn a() {}\n")).toBe("fn a() {}\n");
  });

  test("raw identifiers are not raw strings", () => {
    expect(rs("let r#match = 1; // c\n")).toBe("let r#match = 1;\n");
  });

  test("tokens come out the same with or without comments", () => {
    const source = "fn f<'a>() -> &'a str { /* x */ r#\"//\"# } // y\n";
    expect(lexRust(source).tokens).toEqual(["ident:fn", "ident:f", "punct:<", "lifetime:'a", "punct:>", "punct:(", "punct:)", "punct:-", "punct:>", "punct:&", "lifetime:'a", "ident:str", "punct:{", 'string:r#"//"#', "punct:}"]);
    expect(lexRust(rs(source)).tokens).toEqual(lexRust(source).tokens);
  });

  test("an unterminated literal refuses to lex", () => {
    expect(() => lexRust('let s = "oops;')).toThrow(LexError);
    expect(() => lexRust("fn f() { /* open")).toThrow(LexError);
  });
});

test("a second run changes nothing", () => {
  const once = ts("a(); // x\n\n/* y */\n\nb(/* z */ c);\n");
  expect(once).toBe("a();\n\nb(c);\n");
  expect(ts(once)).toBe(once);
  const rustOnce = rs("// a\nfn f() {\n    // b\n\n    g(); // c\n}\n");
  expect(rustOnce).toBe("fn f() {\n    g();\n}\n");
  expect(rs(rustOnce)).toBe(rustOnce);
});
