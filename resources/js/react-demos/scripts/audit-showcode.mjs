// @ts-check
/**
 * ShowCode audit script — Batch 0 of the docs audit.
 *
 * Walks every *Demo.tsx under resources/js/react-demos/pages/**, finds every
 * <DemoSection ...> JSX element, extracts the `code` prop and the children
 * source, normalizes both, and reports drift.
 *
 * Statuses:
 *   - match             : code string matches normalized children source
 *   - drift             : they differ; report unified diff
 *   - dynamic-skipped   : code prop is non-literal (e.g. template with ${...})
 *                         or children include .map()/ternary/identifier usage
 *                         that can't be statically extracted — needs human audit
 *   - missing-code      : no `code` prop at all (author intentionally omitted,
 *                         or intentional-preview-only section)
 *
 * Usage:  node resources/js/react-demos/scripts/audit-showcode.mjs
 * Output: resources/js/react-demos/scripts/audit-showcode.report.md
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..", "..", "..");
const pagesDir = path.resolve(__dirname, "..", "pages");
const reportPath = path.resolve(__dirname, "audit-showcode.report.md");

/** @type {Array<{file:string, title:string, status:string, codeString:string|null, childrenSource:string|null, diff:string|null, note:string|null}>} */
const results = [];

/** Recursively collect all *.tsx files under a directory. */
function walk(dir) {
  /** @type {string[]} */
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

/** Return the JSX element/self-closing element's tag name as a string. */
function getJsxTagName(node) {
  const open = ts.isJsxElement(node) ? node.openingElement : node;
  const name = open.tagName;
  if (ts.isIdentifier(name)) return name.text;
  if (ts.isPropertyAccessExpression(name)) return name.getText();
  return name.getText();
}

/**
 * Extract a string prop value if it's a plain literal, template-literal without
 * interpolation, or a JSX expression that wraps those. Returns null for dynamic
 * values.
 */
function readStringProp(attr) {
  if (!attr || !attr.initializer) return null;
  const init = attr.initializer;
  if (ts.isStringLiteral(init)) return init.text;
  if (ts.isJsxExpression(init)) {
    const expr = init.expression;
    if (!expr) return null;
    if (ts.isStringLiteral(expr)) return expr.text;
    if (ts.isNoSubstitutionTemplateLiteral(expr)) return expr.text;
    if (ts.isTemplateExpression(expr)) return null; // has ${...}
    return null;
  }
  return null;
}

/** Find an attribute on a JSX opening element by name. */
function findAttr(openingEl, name) {
  for (const a of openingEl.attributes.properties) {
    if (ts.isJsxAttribute(a) && a.name.getText() === name) return a;
  }
  return null;
}

/**
 * Get the source text of JSX children, dedented, outer layout wrapper stripped.
 * Returns null if the children contain non-literal dynamic content that can't
 * be extracted reliably (e.g. .map(), identifiers used as elements).
 */
function extractChildrenSource(sourceFile, children) {
  // Trim leading/trailing JsxText that is whitespace-only
  const trimmed = children.filter((c) => {
    if (ts.isJsxText(c) && c.getText().trim() === "") return false;
    return true;
  });

  if (trimmed.length === 0) return { text: "", dynamic: false };

  // If exactly one child and it's a layout-only wrapper <div>, strip it.
  if (trimmed.length === 1) {
    const only = trimmed[0];
    if (ts.isJsxElement(only)) {
      const tag = getJsxTagName(only);
      if (tag === "div" || tag === "section" || tag === "span") {
        // Heuristic: only strip if the only attributes are layout-ish
        // (className / style). If there's no semantic content beyond layout,
        // pulling it out gives a cleaner canonical code string.
        const attrs = only.openingElement.attributes.properties;
        const layoutOnly = attrs.every((a) => {
          if (!ts.isJsxAttribute(a)) return false;
          const name = a.name.getText();
          return name === "className" || name === "style";
        });
        if (layoutOnly) {
          return extractChildrenSource(sourceFile, only.children);
        }
      }
    }
  }

  // Reject children that contain clearly dynamic JSX expressions.
  // Map + ternary + identifier references to renderables can't be statically
  // materialized to a string that would match hand-written code.
  let dynamic = false;
  const visit = (node) => {
    if (ts.isJsxExpression(node) && node.expression) {
      const e = node.expression;
      if (
        ts.isCallExpression(e) ||
        ts.isConditionalExpression(e) ||
        ts.isBinaryExpression(e) ||
        ts.isArrayLiteralExpression(e)
      ) {
        dynamic = true;
      }
    }
    ts.forEachChild(node, visit);
  };
  for (const c of trimmed) visit(c);
  if (dynamic) return { text: "", dynamic: true };

  // Join the raw source slices of the children.
  const start = trimmed[0].getFullStart();
  const end = trimmed[trimmed.length - 1].getEnd();
  const raw = sourceFile.text.slice(start, end);
  return { text: dedent(raw).trim(), dynamic: false };
}

/**
 * Remove common leading indentation from a multi-line string.
 *
 * Note: The raw source slice for JSX children typically has line 1 at column 0
 * (it starts immediately after the wrapping element's `>`) while lines 2+ are
 * indented to the children's indentation level. We ignore line 1 when computing
 * the minimum indent so that the indentation of lines 2+ is correctly stripped.
 */
function dedent(s) {
  const lines = s.replace(/\r\n/g, "\n").split("\n");
  // Drop leading blank lines
  while (lines.length && lines[0].trim() === "") lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
  if (lines.length === 0) return "";
  let min = Infinity;
  // Skip line 0: its leading whitespace reflects its position at the slice
  // start, not its semantic indent relative to siblings.
  for (let i = 1; i < lines.length; i++) {
    const ln = lines[i];
    if (ln.trim() === "") continue;
    const m = ln.match(/^\s*/);
    const len = m ? m[0].length : 0;
    if (len < min) min = len;
  }
  if (!isFinite(min) || min === 0) return lines.join("\n");
  // Apply dedent to every line except line 0 (which already starts at col 0).
  return lines
    .map((l, i) => (i === 0 ? l : l.slice(min)))
    .join("\n");
}

/** Normalize whitespace/line-endings for comparison. */
function normalizeForCompare(s) {
  return s.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").trim();
}

/** Simple line-level unified diff. */
function unifiedDiff(a, b, labelA = "code prop", labelB = "rendered JSX") {
  const linesA = a.split("\n");
  const linesB = b.split("\n");
  const out = [`--- ${labelA}`, `+++ ${labelB}`];
  const max = Math.max(linesA.length, linesB.length);
  for (let i = 0; i < max; i++) {
    const la = linesA[i];
    const lb = linesB[i];
    if (la === lb) {
      out.push("  " + (la ?? ""));
    } else {
      if (la !== undefined) out.push("- " + la);
      if (lb !== undefined) out.push("+ " + lb);
    }
  }
  return out.join("\n");
}

function auditFile(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const relFile = path.relative(repoRoot, filePath).replace(/\\/g, "/");

  const visit = (node) => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = getJsxTagName(node);
      if (tag === "DemoSection") {
        const opening = ts.isJsxElement(node) ? node.openingElement : node;
        const titleAttr = findAttr(opening, "title");
        const codeAttr = findAttr(opening, "code");
        const title = readStringProp(titleAttr) ?? "(untitled)";

        // Handle a code prop that's a non-literal JSX expression (dynamic).
        let codeString = null;
        let codeDynamic = false;
        if (codeAttr && codeAttr.initializer) {
          codeString = readStringProp(codeAttr);
          if (codeString === null) {
            // Dynamic code prop (template with ${}, identifier, etc.)
            codeDynamic = true;
          }
        }

        if (ts.isJsxElement(node)) {
          const extracted = extractChildrenSource(sf, node.children);
          if (!codeAttr) {
            results.push({
              file: relFile,
              title,
              status: "missing-code",
              codeString: null,
              childrenSource: extracted.text || null,
              diff: null,
              note: "no `code` prop — intentional preview-only?",
            });
          } else if (codeDynamic) {
            results.push({
              file: relFile,
              title,
              status: "dynamic-skipped",
              codeString: null,
              childrenSource: null,
              diff: null,
              note: "`code` prop is a dynamic expression (template interpolation or identifier) — human audit required",
            });
          } else if (extracted.dynamic) {
            results.push({
              file: relFile,
              title,
              status: "dynamic-skipped",
              codeString,
              childrenSource: null,
              diff: null,
              note: "children contain .map()/ternary/dynamic JSX — canonical `code` must be hand-verified",
            });
          } else {
            const a = normalizeForCompare(codeString ?? "");
            const b = normalizeForCompare(extracted.text);
            if (a === b) {
              results.push({
                file: relFile,
                title,
                status: "match",
                codeString,
                childrenSource: extracted.text,
                diff: null,
                note: null,
              });
            } else {
              results.push({
                file: relFile,
                title,
                status: "drift",
                codeString,
                childrenSource: extracted.text,
                diff: unifiedDiff(a, b),
                note: null,
              });
            }
          }
        } else {
          // Self-closing <DemoSection /> — no children to compare
          results.push({
            file: relFile,
            title,
            status: "missing-code",
            codeString,
            childrenSource: null,
            diff: null,
            note: "self-closing DemoSection — no children",
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

function writeReport() {
  const byStatus = {
    drift: [],
    "dynamic-skipped": [],
    "missing-code": [],
    match: [],
  };
  for (const r of results) (byStatus[r.status] ??= []).push(r);

  const total = results.length;
  const lines = [];
  lines.push("# ShowCode Audit Report");
  lines.push("");
  lines.push(`Generated by \`resources/js/react-demos/scripts/audit-showcode.mjs\`.`);
  lines.push("");
  lines.push(`**Total DemoSection blocks:** ${total}`);
  lines.push("");
  lines.push("| Status | Count |");
  lines.push("|---|---|");
  lines.push(`| drift | ${byStatus.drift.length} |`);
  lines.push(`| dynamic-skipped | ${byStatus["dynamic-skipped"].length} |`);
  lines.push(`| missing-code | ${byStatus["missing-code"].length} |`);
  lines.push(`| match | ${byStatus.match.length} |`);
  lines.push("");

  lines.push("## Drifts (code prop does not match rendered JSX)");
  lines.push("");
  if (byStatus.drift.length === 0) {
    lines.push("_None._");
    lines.push("");
  } else {
    for (const r of byStatus.drift) {
      lines.push(`### ${r.file} — ${r.title}`);
      lines.push("");
      lines.push("```diff");
      lines.push(r.diff ?? "");
      lines.push("```");
      lines.push("");
    }
  }

  lines.push("## Dynamic (skipped — needs human audit)");
  lines.push("");
  if (byStatus["dynamic-skipped"].length === 0) {
    lines.push("_None._");
  } else {
    lines.push("| File | Section | Note |");
    lines.push("|---|---|---|");
    for (const r of byStatus["dynamic-skipped"]) {
      lines.push(`| ${r.file} | ${r.title} | ${r.note ?? ""} |`);
    }
  }
  lines.push("");

  lines.push("## Missing code prop");
  lines.push("");
  if (byStatus["missing-code"].length === 0) {
    lines.push("_None._");
  } else {
    lines.push("| File | Section | Note |");
    lines.push("|---|---|---|");
    for (const r of byStatus["missing-code"]) {
      lines.push(`| ${r.file} | ${r.title} | ${r.note ?? ""} |`);
    }
  }
  lines.push("");

  lines.push("## Matches (by file)");
  lines.push("");
  const byFile = new Map();
  for (const r of byStatus.match) {
    if (!byFile.has(r.file)) byFile.set(r.file, []);
    byFile.get(r.file).push(r.title);
  }
  if (byFile.size === 0) {
    lines.push("_None._");
  } else {
    for (const [file, titles] of [...byFile.entries()].sort()) {
      lines.push(`- \`${file}\` — ${titles.length} section(s): ${titles.map((t) => `"${t}"`).join(", ")}`);
    }
  }
  lines.push("");

  fs.writeFileSync(reportPath, lines.join("\n"), "utf8");
}

function main() {
  const files = walk(pagesDir);
  for (const f of files) auditFile(f);
  writeReport();

  const drift = results.filter((r) => r.status === "drift").length;
  const dyn = results.filter((r) => r.status === "dynamic-skipped").length;
  const missing = results.filter((r) => r.status === "missing-code").length;
  const match = results.filter((r) => r.status === "match").length;
  console.log(`Scanned ${files.length} files, ${results.length} DemoSection blocks.`);
  console.log(`  match:           ${match}`);
  console.log(`  drift:           ${drift}`);
  console.log(`  dynamic-skipped: ${dyn}`);
  console.log(`  missing-code:    ${missing}`);
  console.log(`Report: ${path.relative(repoRoot, reportPath).replace(/\\/g, "/")}`);
}

main();
