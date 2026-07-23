import React from "react";
import { Box, Text as InkText } from "ink";

/**
 * A tiny, dependency-free TSX syntax highlighter for the SOURCE panel.
 *
 * fancy-tui's `CodeView` delegates to `Markdown` → marked-terminal, which does
 * NOT tokenize — it renders a whole code block in one colour. So the docs TUI
 * had no real highlighting. This module supplies it: a compact per-line
 * tokenizer plus an Ink renderer that paints each token as a coloured `<Text>`
 * span. It is deliberately self-contained (no new npm deps).
 *
 * Per-LINE tokenization is a choice, not a limitation: the SOURCE pane truncates
 * every line to the pane width and never wraps (the fixed-frame budget has no
 * rows to spare), so each visible line is highlighted on its own. A multi-line
 * string or block comment would therefore be coloured per line rather than as a
 * span — fine for the short, single-expression snippets the showcase ships.
 *
 * Tokenizing NEVER changes a line's visible width: the tokens partition the
 * exact input string with no characters added or removed, so a line that fit
 * before still fits — only ANSI colour codes are interleaved.
 */

export type TokenKind =
  | "keyword"
  | "string"
  | "tag"
  | "attr"
  | "comment"
  | "number"
  | "punct"
  | "plain";

export interface Token {
  text: string;
  kind: TokenKind;
}

const KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "export", "default", "import",
  "from", "if", "else", "for", "while", "switch", "case", "break", "continue",
  "new", "of", "in", "typeof", "instanceof", "async", "await", "yield", "type",
  "interface", "enum", "class", "extends", "implements", "public", "private",
  "protected", "readonly", "static", "as", "void", "true", "false", "null",
  "undefined", "this", "super",
]);

const IDENT_START = /[A-Za-z_$]/;
const IDENT_REST = /^[A-Za-z0-9_$]*/;

/**
 * Split one line of TSX into coloured tokens.
 *
 * A small hand-rolled scanner rather than a regex soup: it walks the line once,
 * classifying comments, strings (single/double/template), JSX tag names,
 * attribute names (an identifier immediately before `=`, excluding `==`/`=>`),
 * keywords, numbers, and punctuation. Anything else is `plain`.
 */
export function tokenizeTsx(line: string): Token[] {
  const tokens: Token[] = [];
  const n = line.length;
  let i = 0;

  const push = (text: string, kind: TokenKind) => {
    if (text) tokens.push({ text, kind });
  };

  while (i < n) {
    const ch = line[i]!;

    // Whitespace — carried as plain so widths stay exact.
    if (ch === " " || ch === "\t") {
      let j = i + 1;
      while (j < n && (line[j] === " " || line[j] === "\t")) j++;
      push(line.slice(i, j), "plain");
      i = j;
      continue;
    }

    // Line comment — to end of line.
    if (ch === "/" && line[i + 1] === "/") {
      push(line.slice(i), "comment");
      break;
    }

    // Block comment — on this line only (per-line model).
    if (ch === "/" && line[i + 1] === "*") {
      const end = line.indexOf("*/", i + 2);
      const stop = end === -1 ? n : end + 2;
      push(line.slice(i, stop), "comment");
      i = stop;
      continue;
    }

    // String / template literal — greedy to the matching quote (or EOL).
    if (ch === '"' || ch === "'" || ch === "`") {
      let j = i + 1;
      while (j < n) {
        if (line[j] === "\\") {
          j += 2;
          continue;
        }
        if (line[j] === ch) {
          j++;
          break;
        }
        j++;
      }
      const stop = Math.min(j, n);
      push(line.slice(i, stop), "string");
      i = stop;
      continue;
    }

    // JSX tag open/close: `<Tag`, `</Tag` — the `<`/`</` is punct, the name is a tag.
    if (ch === "<" && /[A-Za-z/]/.test(line[i + 1] ?? "")) {
      let j = i + 1;
      let slash = "";
      if (line[j] === "/") {
        slash = "/";
        j++;
      }
      const m = /^[A-Za-z][A-Za-z0-9.]*/.exec(line.slice(j));
      if (m) {
        push("<" + slash, "punct");
        push(m[0], "tag");
        i = j + m[0].length;
        continue;
      }
    }

    // Identifier / keyword / attribute name.
    if (IDENT_START.test(ch)) {
      const rest = IDENT_REST.exec(line.slice(i + 1))?.[0] ?? "";
      const word = ch + rest;
      const j = i + word.length;
      if (KEYWORDS.has(word)) {
        push(word, "keyword");
      } else {
        // Attribute if the next non-space char is a lone `=` (not `==`, not `=>`).
        let k = j;
        while (k < n && line[k] === " ") k++;
        const isAttr = line[k] === "=" && line[k + 1] !== "=" && line[k + 1] !== ">";
        push(word, isAttr ? "attr" : "plain");
      }
      i = j;
      continue;
    }

    // Number.
    if (ch >= "0" && ch <= "9") {
      const rest = /^[0-9._]*/.exec(line.slice(i + 1))?.[0] ?? "";
      const num = ch + rest;
      push(num, "number");
      i += num.length;
      continue;
    }

    // Punctuation.
    if ("{}()[]<>=;:,./|&?!+-*%".includes(ch)) {
      push(ch, "punct");
      i++;
      continue;
    }

    // Anything else (unicode, ellipsis truncation marker, …) — plain.
    push(ch, "plain");
    i++;
  }

  return tokens;
}

/**
 * Ink colour per token kind. Punctuation and plain text keep the terminal's
 * default foreground so the coloured identifiers pop against quiet brackets.
 * These are ANSI colour NAMES — they resolve through the browser terminal's
 * 16-colour palette (set in `DocsTui.tsx`), so completing that palette is what
 * makes them vivid.
 */
const TOKEN_COLOR: Partial<Record<TokenKind, string>> = {
  keyword: "magenta",
  tag: "cyan",
  attr: "yellow",
  string: "green",
  number: "blue",
  comment: "gray",
};

/** Render a line's tokens as coloured Ink spans (Fancy mode). */
function renderTokens(line: string): React.ReactNode {
  return tokenizeTsx(line).map((token, index) => {
    const color = TOKEN_COLOR[token.kind];
    return color ? (
      <InkText key={index} color={color}>{token.text}</InkText>
    ) : (
      <InkText key={index}>{token.text}</InkText>
    );
  });
}

/**
 * The SOURCE panel — a single-bordered box with a line-number gutter, matching
 * `CodeView`'s footprint (border + one row per line) so the fixed-frame row
 * budget is unchanged. In Fancy mode each line is syntax-highlighted; in Plain
 * mode it is rendered monochrome. Lines arrive pre-truncated, so nothing wraps.
 */
export function SourceView({
  lines,
  fancy,
  lineNumbers = true,
}: {
  lines: string[];
  fancy: boolean;
  lineNumbers?: boolean;
}) {
  return (
    <Box borderStyle="single" paddingX={1} flexDirection="column">
      {lines.map((line, index) => (
        <InkText key={index}>
          {lineNumbers ? (
            <InkText dimColor>{`${String(index + 1).padStart(3)} │ `}</InkText>
          ) : null}
          {fancy ? renderTokens(line) : <InkText>{line}</InkText>}
        </InkText>
      ))}
    </Box>
  );
}
