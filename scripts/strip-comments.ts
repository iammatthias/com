import { Glob } from "bun";
import { resolve } from "node:path";

export type Language = "typescript" | "rust";
export type Loader = "ts" | "js";
export type Comment = { start: number; end: number; text: string; directive: string | null };
export type Lexed = { comments: Comment[]; tokens: string[] };

type Directives = readonly (readonly [label: string, pattern: RegExp])[];
type Scope = { area: string; pattern: string; language: Language };
type Brace = "block" | "object" | "template";

const repo = resolve(import.meta.dir, "..");

const scopes: readonly Scope[] = [
  { area: "app/src", pattern: "app/src/**/*.rs", language: "rust" },
  { area: "app/shims", pattern: "app/shims/**/*.rs", language: "rust" },
  { area: "app/js", pattern: "app/js/**/*.js", language: "typescript" },
  { area: "app/e2e", pattern: "app/e2e/*.mjs", language: "typescript" },
  { area: "app/scripts", pattern: "app/scripts/*.{ts,mjs,js}", language: "typescript" },
  { area: "worker/src", pattern: "worker/src/**/*.ts", language: "typescript" },
  { area: "worker/test", pattern: "worker/test/**/*.ts", language: "typescript" },
  { area: "worker/scripts", pattern: "worker/scripts/**/*.{ts,mjs,js}", language: "typescript" },
  { area: "og", pattern: "og/{src,test,scripts}/**/*.{ts,mjs,js}", language: "typescript" },
  { area: "scripts", pattern: "scripts/**/*.ts", language: "typescript" },
];

const excluded = /(^|\/)(node_modules|target|dist|fixtures|shots|vendor)\//;

const typescriptDirectives: Directives = [
  ["ts pragma", /^\/[/*]\s*@ts-/],
  ["triple-slash", /^\/\/\/\s*<(reference|amd-module|amd-dependency)\b/],
  ["bundler hint", /^\/\*\s*(@vite-ignore|webpack[A-Z]\w*)/],
  ["linter", /^\/[/*]\s*(eslint|biome-ignore|prettier-ignore|deno-lint-ignore|oxlint)/],
  ["source map", /^\/[/*][#@]\s*source(Mapping)?URL=/],
  ["license", /^\/\*!|@license\b|@preserve\b/],
  ["purity annotation", /^\/\*\s*[#@]__(PURE|NO_SIDE_EFFECTS)__\s*\*\/$/],
  ["coverage", /^\/[/*]\s*(istanbul|c8|v8) ignore/],
  ["jsx pragma", /^\/[/*]\*?\s*@jsx/],
];

const rustDirectives: Directives = [];

const ts = await loadTypescript();

async function loadTypescript() {
  const from = resolve(repo, "worker");
  try {
    const ast = await import(Bun.resolveSync("typescript/unstable/ast", from));
    return {
      createScanner: ast.createScanner as (skipTrivia: boolean, variant: number, text: string, start?: number) => Scanner,
      isKeywordKind: ast.isKeywordKind as (kind: number) => boolean,
      K: ast.SyntaxKind as Record<string, number>,
      standard: ast.LanguageVariant.Standard as number,
    };
  } catch (cause) {
    throw new Error("strip-comments reads TypeScript 7's scanner from worker/node_modules: run `bun install` in worker/", { cause });
  }
}

type Scanner = {
  scan(): number;
  getTokenStart(): number;
  getTokenEnd(): number;
  getTokenText(): string;
  isUnterminated(): boolean;
  reScanSlashToken(): number;
  reScanTemplateToken(isTaggedTemplate: boolean): number;
};

export class LexError extends Error {
  constructor(source: string, offset: number, problem: string) {
    super(`${problem} at line ${lineOf(source, offset)}`);
  }
}

function lineOf(source: string, offset: number): number {
  let line = 1;
  for (let i = source.indexOf("\n"); i !== -1 && i < offset; i = source.indexOf("\n", i + 1)) line++;
  return line;
}

function comment(source: string, start: number, end: number, directives: Directives): Comment {
  const text = source.slice(start, end);
  return { start, end, text, directive: directives.find(([, pattern]) => pattern.test(text))?.[0] ?? null };
}

export function lexTypescript(source: string): Lexed {
  const { K, isKeywordKind } = ts;
  const comments: Comment[] = [];
  const tokens: string[] = [];
  const shebang = source.startsWith("#!") ? source.indexOf("\n") : -1;
  if (source.startsWith("#!")) {
    const end = shebang === -1 ? source.length : shebang;
    comments.push({ start: 0, end, text: source.slice(0, end), directive: "shebang" });
  }
  const scanner = ts.createScanner(false, ts.standard, source, Math.max(shebang, 0));
  const regexKeywords = new Set(
    ["Return", "Typeof", "Instanceof", "In", "New", "Delete", "Void", "Throw", "Case", "Do", "Else", "Yield", "Await"].map(
      (name) => K[`${name}Keyword`],
    ),
  );
  const controlKeywords = new Set(["If", "While", "For", "With"].map((name) => K[`${name}Keyword`]));
  const valueEnders = new Set([
    K.Identifier,
    K.PrivateIdentifier,
    K.CloseBracketToken,
    K.PlusPlusToken,
    K.MinusMinusToken,
    K.NumericLiteral,
    K.BigIntLiteral,
    K.StringLiteral,
    K.RegularExpressionLiteral,
    K.NoSubstitutionTemplateLiteral,
    K.TemplateTail,
  ]);
  const blockOpeners = new Set([
    K.CloseParenToken,
    K.SemicolonToken,
    K.OpenBraceToken,
    K.CloseBraceToken,
    K.EqualsGreaterThanToken,
    K.Identifier,
    K.GreaterThanToken,
    K.ElseKeyword,
    K.DoKeyword,
    K.TryKeyword,
    K.FinallyKeyword,
  ]);
  const braces: Brace[] = [];
  const parens: boolean[] = [];
  let previous: number | null = null;
  let slashStartsRegex = true;
  for (let kind = scanner.scan(); kind !== K.EndOfFile; kind = scanner.scan()) {
    if (kind === K.WhitespaceTrivia || kind === K.NewLineTrivia) continue;
    if (kind === K.SingleLineCommentTrivia || kind === K.MultiLineCommentTrivia) {
      comments.push(comment(source, scanner.getTokenStart(), scanner.getTokenEnd(), typescriptDirectives));
      continue;
    }
    let closedBlock = false;
    let closedControl = false;
    if ((kind === K.SlashToken || kind === K.SlashEqualsToken) && slashStartsRegex) kind = scanner.reScanSlashToken();
    if (kind === K.CloseBraceToken && braces.at(-1) === "template") {
      braces.pop();
      kind = scanner.reScanTemplateToken(false);
      if (kind === K.TemplateMiddle) braces.push("template");
    } else if (kind === K.CloseBraceToken) {
      closedBlock = braces.pop() === "block";
    } else if (kind === K.OpenBraceToken) {
      braces.push(previous === null || blockOpeners.has(previous) ? "block" : "object");
    } else if (kind === K.TemplateHead) {
      braces.push("template");
    } else if (kind === K.OpenParenToken) {
      parens.push(previous !== null && controlKeywords.has(previous));
    } else if (kind === K.CloseParenToken) {
      closedControl = parens.pop() ?? false;
    }
    if (kind === K.Unknown || kind === K.ConflictMarkerTrivia || scanner.isUnterminated()) {
      throw new LexError(source, scanner.getTokenStart(), `unreadable token ${JSON.stringify(scanner.getTokenText())}`);
    }
    tokens.push(`${kind}:${scanner.getTokenText()}`);
    previous = kind;
    slashStartsRegex =
      kind === K.CloseParenToken
        ? closedControl
        : kind === K.CloseBraceToken
          ? closedBlock
          : valueEnders.has(kind) || kind === K.ThisKeyword || kind === K.SuperKeyword
            ? false
            : isKeywordKind(kind)
              ? regexKeywords.has(kind)
              : true;
  }
  if (braces.length > 0 || parens.length > 0) throw new LexError(source, source.length, "unbalanced brackets");
  return { comments, tokens };
}

const identStart = /[\p{XID_Start}_]/u;
const identPart = /[\p{XID_Continue}]/u;

export function lexRust(source: string): Lexed {
  const comments: Comment[] = [];
  const tokens: string[] = [];
  const delimiters: string[] = [];
  const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const at = (i: number) => source[i] ?? "";
  const identEnd = (from: number) => {
    let j = from;
    while (j < source.length) {
      const ch = String.fromCodePoint(source.codePointAt(j)!);
      if (!identPart.test(ch)) break;
      j += ch.length;
    }
    return j;
  };
  const quoted = (open: number, quote: string) => {
    for (let j = open + 1; j < source.length; j++) {
      if (source[j] === "\\") j++;
      else if (source[j] === quote) return j + 1;
    }
    throw new LexError(source, open, "unterminated literal");
  };
  const raw = (hashesFrom: number) => {
    let j = hashesFrom;
    while (source[j] === "#") j++;
    const closing = `"${"#".repeat(j - hashesFrom)}`;
    const end = source.indexOf(closing, j + 1);
    if (end === -1) throw new LexError(source, hashesFrom, "unterminated raw string");
    return end + closing.length;
  };
  const opensRaw = (from: number) => {
    let j = from;
    while (source[j] === "#") j++;
    return source[j] === '"';
  };
  let i = 0;
  while (i < source.length) {
    const ch = source[i]!;
    let end: number;
    let kind = "punct";
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === "/" && at(i + 1) === "/") {
      const newline = source.indexOf("\n", i);
      end = newline === -1 ? source.length : newline;
      comments.push(comment(source, i, end, rustDirectives));
      i = end;
      continue;
    }
    if (ch === "/" && at(i + 1) === "*") {
      let depth = 0;
      end = i;
      do {
        if (end >= source.length) throw new LexError(source, i, "unterminated block comment");
        if (source.startsWith("/*", end)) {
          depth++;
          end += 2;
        } else if (source.startsWith("*/", end)) {
          depth--;
          end += 2;
        } else end++;
      } while (depth > 0);
      comments.push(comment(source, i, end, rustDirectives));
      i = end;
      continue;
    }
    if (identStart.test(String.fromCodePoint(source.codePointAt(i)!))) {
      const wordEnd = identEnd(i);
      const word = source.slice(i, wordEnd);
      const next = at(wordEnd);
      if ((word === "r" || word === "br" || word === "cr") && opensRaw(wordEnd)) {
        kind = "string";
        end = raw(wordEnd);
      } else if ((word === "b" || word === "c") && next === '"') {
        kind = "string";
        end = quoted(wordEnd, '"');
      } else if (word === "b" && next === "'") {
        kind = "char";
        end = quoted(wordEnd, "'");
      } else if (word === "r" && next === "#" && identStart.test(at(wordEnd + 1))) {
        kind = "ident";
        end = identEnd(wordEnd + 1);
      } else {
        kind = "ident";
        end = wordEnd;
      }
    } else if (/[0-9]/.test(ch)) {
      kind = "number";
      end = i + 1;
      while (/[0-9A-Za-z_]/.test(at(end)) || (at(end) === "." && /[0-9]/.test(at(end + 1)))) end++;
    } else if (ch === '"') {
      kind = "string";
      end = quoted(i, '"');
    } else if (ch === "'") {
      const width = String.fromCodePoint(source.codePointAt(i + 1) ?? 0).length;
      if (at(i + 1) === "\\") {
        kind = "char";
        end = quoted(i, "'");
      } else if (at(i + 1 + width) === "'") {
        kind = "char";
        end = i + 2 + width;
      } else {
        kind = "lifetime";
        end = identEnd(i + 1);
        if (end === i + 1) throw new LexError(source, i, "stray quote");
      }
    } else {
      end = i + ch.length;
      if ("([{".includes(ch)) delimiters.push(ch);
      if (ch in pairs && delimiters.pop() !== pairs[ch]) throw new LexError(source, i, `unbalanced ${ch}`);
    }
    tokens.push(`${kind}:${source.slice(i, end)}`);
    i = end;
  }
  if (delimiters.length > 0) throw new LexError(source, source.length, "unclosed delimiter");
  return { comments, tokens };
}

const isBlank = (line: string) => /^[ \t]*$/.test(line);
const leadingSpace = (s: string) => s.length - s.replace(/^[ \t]+/, "").length;
const trailingSpace = (s: string) => s.length - s.replace(/[ \t]+$/, "").length;

function joiner(left: string, right: string, removed: string): string {
  if (removed.includes("\n")) return "\n";
  return /[([{]$/.test(left) || /^[)\]},;.]/.test(right) ? "" : " ";
}

export function strip(source: string, removable: readonly Comment[]): string {
  let text = source;
  let junctions: number[] = [];
  const edit = (start: number, end: number, replacement = "") => {
    text = text.slice(0, start) + replacement + text.slice(end);
    const delta = replacement.length - (end - start);
    junctions = junctions.map((j) => (j >= end ? j + delta : j));
  };
  for (const { start, end, text: removed } of [...removable].sort((a, b) => b.start - a.start)) {
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const newline = text.indexOf("\n", end);
    const lineEnd = newline === -1 ? text.length : newline;
    const before = text.slice(lineStart, start);
    const after = text.slice(end, lineEnd);
    if (isBlank(before) && isBlank(after)) {
      if (newline === -1) edit(Math.max(lineStart - 1, 0), lineEnd);
      else {
        edit(lineStart, newline + 1);
        junctions.push(lineStart);
      }
    } else if (isBlank(after)) {
      edit(start - trailingSpace(before), lineEnd);
    } else if (isBlank(before)) {
      edit(start, end + leadingSpace(after));
    } else {
      const left = before.slice(0, before.length - trailingSpace(before));
      const right = after.slice(leadingSpace(after));
      edit(start - trailingSpace(before), end + leadingSpace(after), joiner(left, right, removed));
    }
  }
  for (const junction of [...new Set(junctions)].sort((a, b) => b - a)) text = collapse(text, junction);
  return text;
}

function collapse(source: string, junction: number): string {
  let text = source;
  let j = junction;
  const lineFrom = (p: number) => {
    const e = text.indexOf("\n", p);
    return text.slice(p, e === -1 ? text.length : e);
  };
  for (;;) {
    const next = j < text.length ? lineFrom(j) : null;
    const previousStart = j === 0 ? -1 : text.lastIndexOf("\n", j - 2) + 1;
    const previous = previousStart === -1 ? null : text.slice(previousStart, j - 1);
    if (next !== null && isBlank(next) && (previous === null || isBlank(previous) || /[([{][ \t]*$/.test(previous))) {
      text = text.slice(0, j) + text.slice(j + next.length + 1);
    } else if (previous !== null && isBlank(previous) && (next === null || /^[ \t]*[)\]}]/.test(next))) {
      text = text.slice(0, previousStart) + text.slice(j);
      j = previousStart;
    } else return text;
  }
}

export function lex(source: string, language: Language): Lexed {
  return language === "rust" ? lexRust(source) : lexTypescript(source);
}

function transpiled(source: string, loader: Loader): string {
  return new Bun.Transpiler({ loader, minifyWhitespace: true, trimUnusedImports: false }).transformSync(source);
}

export type Outcome = { after: string; kept: Comment[]; removed: Comment[] };

export function stripSource(source: string, language: Language, loader: Loader = "ts"): Outcome {
  if (source.includes("\r")) throw new LexError(source, source.indexOf("\r"), "carriage return");
  const lexed = lex(source, language);
  const removed = lexed.comments.filter((c) => c.directive === null);
  const kept = lexed.comments.filter((c) => c.directive !== null);
  const after = removed.length === 0 ? source : strip(source, removed);
  const relexed = lex(after, language);
  if (relexed.tokens.join("\n") !== lexed.tokens.join("\n")) throw new Error("code tokens changed");
  if (relexed.comments.some((c) => c.directive === null) || relexed.comments.length !== kept.length) {
    throw new Error("comments survived the strip");
  }
  if (language === "typescript" && after !== source && transpiled(after, loader) !== transpiled(source, loader)) {
    throw new Error("Bun's transpiler output changed");
  }
  return { after, kept, removed };
}

function lineCount(text: string): number {
  return text.split("\n").length;
}

async function run(check: boolean): Promise<number> {
  const results: { path: string; area: string; source: string; outcome: Outcome }[] = [];
  const failures: string[] = [];
  for (const { area, pattern, language } of scopes) {
    for await (const path of new Glob(pattern).scan({ cwd: repo, onlyFiles: true })) {
      if (excluded.test(path)) continue;
      const source = await Bun.file(resolve(repo, path)).text();
      try {
        results.push({ path, area, source, outcome: stripSource(source, language, path.endsWith(".ts") ? "ts" : "js") });
      } catch (error) {
        failures.push(`${path}: ${(error as Error).message}`);
      }
    }
  }
  results.sort((a, b) => a.path.localeCompare(b.path));
  for (const failure of failures) console.error(`cannot strip ${failure}`);
  if (failures.length > 0) return 2;
  for (const { path, source, outcome } of results) {
    for (const c of outcome.kept) console.log(`kept ${c.directive}: ${path}:${lineOf(source, c.start)} ${c.text}`);
  }
  const dirty = results.filter((r) => r.outcome.removed.length > 0);
  if (check) {
    for (const { path, outcome } of dirty) console.log(`${path}: ${outcome.removed.length} comments`);
    return dirty.length > 0 ? 1 : 0;
  }
  const byArea = new Map<string, { files: number; comments: number; lines: number }>();
  for (const { path, area, source, outcome } of dirty) {
    await Bun.write(resolve(repo, path), outcome.after);
    const tally = byArea.get(area) ?? { files: 0, comments: 0, lines: 0 };
    tally.files++;
    tally.comments += outcome.removed.length;
    tally.lines += lineCount(source) - lineCount(outcome.after);
    byArea.set(area, tally);
  }
  for (const [area, { files, comments, lines }] of byArea) {
    console.log(`${area}: ${comments} comments, ${lines} lines removed across ${files} files`);
  }
  if (dirty.length === 0) console.log("no comments to strip");
  return 0;
}

if (import.meta.main) process.exit(await run(process.argv.includes("--check")));
