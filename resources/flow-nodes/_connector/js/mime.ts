// GENERATED from @particle-academy/fancy-connector-core — src/mime.ts
// Do not edit here. Fix it in the package and re-run `node scripts/vendor.mjs --target <this directory>` there;
// a test fails the build when this copy and the package disagree.

/**
 * Raw MIME in, headers / parts / attachments out — the payload TRANSFORM an
 * inbound-email trigger declares.
 *
 * Written from scratch (the owner: no third-party code), as ONE implementation
 * in two runtimes — `php/src/Mime.php` is the twin — and held to the authored
 * corpus under `fixtures/mime/`, which both must reproduce byte for byte.
 * `fixtures/mime/README.md` lists every decision a case pins; the ones that
 * are easy to get differently in two languages are restated here:
 *
 * - Header lines are read as Latin-1 (one byte, one char), unfolded with a
 *   single space, names lowercased, values RFC 2047-decoded (B and Q; adjacent
 *   encoded-words join without the whitespace between them).
 * - The line break before a boundary delimiter belongs to the DELIMITER.
 * - `size` is the transfer-decoded byte length, before any charset conversion.
 * - A text part comes back as UTF-8 with the message's own line endings. A
 *   charset this module does not decode (anything but utf-8, us-ascii,
 *   iso-8859-1, iso-8859-15, windows-1252) leaves the part with no text.
 * - Every non-text leaf is an attachment, as is a text leaf declared
 *   `attachment`; attachments carry their bytes as base64. `filename*` (RFC
 *   2231) wins over `filename`, which wins over Content-Type's `name`.
 * - `messageId` is the header verbatim; `contentId` has its angle brackets
 *   stripped, because `cid:` references omit them.
 */

export type MimeHeader = { name: string; value: string };

export type MimePart = {
  index: number;
  contentType: string;
  charset: string | null;
  disposition: "inline" | "attachment" | null;
  filename: string | null;
  contentId: string | null;
  size: number;
  headers: MimeHeader[];
};

export type MimeAttachment = MimePart & { content: string };

export type MimeMessage = {
  headers: MimeHeader[];
  subject: string | null;
  messageId: string | null;
  text: string | null;
  html: string | null;
  parts: MimePart[];
  attachments: MimeAttachment[];
};

/* ── Bytes ───────────────────────────────────────────────────────────────── */

const CR = 13;
const LF = 10;

function latin1(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return s;
}

function bytesOfLatin1(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
}

/** Where the header block ends: the first blank line, CRLF or LF. Returns [headerEnd, bodyStart]. */
function splitEntity(bytes: Uint8Array): [number, number] {
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === LF) {
      if (bytes[i + 1] === LF) return [i, i + 2];
      if (bytes[i + 1] === CR && bytes[i + 2] === LF) return [i, i + 3];
    }
  }
  return [bytes.length, bytes.length];
}

/* ── Headers ─────────────────────────────────────────────────────────────── */

function parseHeaders(block: string): MimeHeader[] {
  const lines = block.split(/\r?\n/);
  const unfolded: string[] = [];
  for (const line of lines) {
    if (line === "") continue;
    if ((line.startsWith(" ") || line.startsWith("\t")) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += " " + line.trim();
    } else {
      unfolded.push(line);
    }
  }
  const headers: MimeHeader[] = [];
  for (const line of unfolded) {
    const colon = line.indexOf(":");
    if (colon <= 0) continue;
    headers.push({ name: line.slice(0, colon).trim().toLowerCase(), value: decodeWords(line.slice(colon + 1).trim()) });
  }
  return headers;
}

function header(headers: MimeHeader[], name: string): string | null {
  return headers.find((h) => h.name === name)?.value ?? null;
}

/* ── RFC 2047 encoded-words ──────────────────────────────────────────────── */

const ENCODED_WORD = /=\?([^?\s]+)\?([BbQq])\?([^?\s]*)\?=/g;

function decodeWords(value: string): string {
  // Adjacent encoded-words are one token: the whitespace between them is not
  // part of the text (RFC 2047 §6.2).
  const joined = value.replace(/(\?=)[ \t\r\n]+(=\?)/g, "$1$2");
  return joined.replace(ENCODED_WORD, (whole, charset: string, encoding: string, text: string) => {
    const bytes =
      encoding.toUpperCase() === "B"
        ? base64Bytes(text)
        : bytesOfLatin1(text.replace(/_/g, " ").replace(/=([0-9A-Fa-f]{2})/g, (_m, h: string) => String.fromCharCode(parseInt(h, 16))));
    const decoded = decodeCharset(bytes, charset);
    return decoded ?? whole;
  });
}

/* ── Parameters (Content-Type, Content-Disposition), with RFC 2231 ───────── */

function parseParams(value: string): { main: string; params: Record<string, string> } {
  const [head, ...rest] = value.split(";");
  const params: Record<string, string> = {};
  const continued: Record<string, string[]> = {};
  for (const piece of rest) {
    const eq = piece.indexOf("=");
    if (eq < 0) continue;
    let key = piece.slice(0, eq).trim().toLowerCase();
    let raw = piece.slice(eq + 1).trim();
    if (raw.startsWith('"') && raw.endsWith('"') && raw.length >= 2) raw = raw.slice(1, -1).replace(/\\(.)/g, "$1");

    // RFC 2231: `name*=charset'lang'percent-encoded`, and `name*0*=`, `name*1=`
    // continuations. A starred key carries an encoding; a numbered one is a
    // segment.
    const segment = /^(.+?)\*(\d+)(\*)?$/.exec(key);
    if (segment) {
      const [, base, n, star] = segment;
      (continued[base!] ??= [])[Number(n)] = star ? decode2231(raw, Number(n) === 0) : raw;
      continue;
    }
    if (key.endsWith("*")) {
      key = key.slice(0, -1);
      params[key] = decode2231(raw, true);
      continue;
    }
    params[key] ??= raw;
  }
  for (const [base, parts] of Object.entries(continued)) params[base] = parts.join("");
  return { main: (head ?? "").trim().toLowerCase(), params };
}

let pendingCharset2231 = "utf-8";

function decode2231(raw: string, first: boolean): string {
  let text = raw;
  if (first) {
    const m = /^([^']*)'[^']*'(.*)$/s.exec(raw);
    if (m) {
      pendingCharset2231 = m[1] || "utf-8";
      text = m[2]!;
    }
  }
  const bytes = bytesOfLatin1(text.replace(/%([0-9A-Fa-f]{2})/g, (_m, h: string) => String.fromCharCode(parseInt(h, 16))));
  return decodeCharset(bytes, pendingCharset2231) ?? text;
}

/* ── Transfer encodings and charsets ─────────────────────────────────────── */

function base64Bytes(text: string): Uint8Array {
  return new Uint8Array(Buffer.from(text.replace(/[^A-Za-z0-9+/=]/g, ""), "base64"));
}

function quotedPrintableBytes(bytes: Uint8Array): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]!;
    if (b !== 0x3d /* = */) {
      out.push(b);
      continue;
    }
    const a = bytes[i + 1];
    const c = bytes[i + 2];
    // Soft line break: `=` then CRLF or LF.
    if (a === LF) {
      i += 1;
      continue;
    }
    if (a === CR && c === LF) {
      i += 2;
      continue;
    }
    if (a !== undefined && c !== undefined && isHex(a) && isHex(c)) {
      out.push(parseInt(String.fromCharCode(a, c), 16));
      i += 2;
      continue;
    }
    out.push(b);
  }
  return new Uint8Array(out);
}

function isHex(b: number): boolean {
  return (b >= 0x30 && b <= 0x39) || (b >= 0x41 && b <= 0x46) || (b >= 0x61 && b <= 0x66);
}

function transferDecode(body: Uint8Array, encoding: string | null): Uint8Array {
  switch ((encoding ?? "7bit").trim().toLowerCase()) {
    case "base64":
      return base64Bytes(latin1(body));
    case "quoted-printable":
      return quotedPrintableBytes(body);
    default:
      return body;
  }
}

/** UTF-8 text for a charset this module decodes; null for one it does not. */
function decodeCharset(bytes: Uint8Array, charset: string): string | null {
  switch (charset.trim().toLowerCase()) {
    case "utf-8":
    case "utf8":
      return new TextDecoder("utf-8").decode(bytes);
    case "us-ascii":
    case "ascii":
    case "iso-8859-1":
    case "latin1":
      // Node's `latin1` is true ISO-8859-1 (0x80–0x9F are C1 controls); the
      // WHATWG TextDecoder would silently give windows-1252 instead, which
      // the PHP twin does not.
      return Buffer.from(bytes).toString("latin1");
    case "windows-1252":
    case "cp1252":
      return new TextDecoder("windows-1252").decode(bytes);
    case "iso-8859-15":
    case "latin9":
      return new TextDecoder("iso-8859-15").decode(bytes);
    default:
      return null;
  }
}

/* ── Entities ────────────────────────────────────────────────────────────── */

type Collected = { parts: MimePart[]; attachments: MimeAttachment[]; text: string | null; html: string | null };

function walk(bytes: Uint8Array, entityHeaders: MimeHeader[] | null, acc: Collected): void {
  const [headerEnd, bodyStart] = splitEntity(bytes);
  const headers = entityHeaders ?? parseHeaders(latin1(bytes.subarray(0, headerEnd)));
  const body = bytes.subarray(entityHeaders ? 0 : bodyStart);

  const type = parseParams(header(headers, "content-type") ?? "text/plain");

  if (type.main.startsWith("multipart/") && type.params.boundary) {
    for (const child of splitMultipart(body, type.params.boundary)) walk(child, null, acc);
    return;
  }

  const disposition = parseParams(header(headers, "content-disposition") ?? "");
  const decoded = transferDecode(body, header(headers, "content-transfer-encoding"));
  const declaredDisposition = disposition.main === "attachment" || disposition.main === "inline" ? disposition.main : null;
  const filename = disposition.params.filename ?? type.params.name ?? null;
  const contentId = header(headers, "content-id")?.replace(/^<|>$/g, "") ?? null;
  const isText = type.main.startsWith("text/");
  const isAttachment = declaredDisposition === "attachment" || !isText;

  const part: MimePart = {
    index: acc.parts.length,
    contentType: type.main,
    charset: type.params.charset?.toLowerCase() ?? null,
    disposition: declaredDisposition,
    filename,
    contentId,
    size: decoded.length,
    headers,
  };
  acc.parts.push(part);

  if (isAttachment) {
    acc.attachments.push({ ...part, content: Buffer.from(decoded).toString("base64") });
    return;
  }

  const text = decodeCharset(decoded, type.params.charset ?? "utf-8");
  if (text === null) return;
  if (type.main === "text/plain" && acc.text === null) acc.text = text;
  if (type.main === "text/html" && acc.html === null) acc.html = text;
}

/** The bodies between delimiters — the CRLF before each delimiter is the delimiter's. */
function splitMultipart(body: Uint8Array, boundary: string): Uint8Array[] {
  const delimiter = bytesOfLatin1(`--${boundary}`);
  const children: Uint8Array[] = [];
  let partStart = -1;

  for (let i = 0; i <= body.length - delimiter.length; i++) {
    if (i !== 0 && body[i - 1] !== LF) continue;
    if (!startsWith(body, i, delimiter)) continue;

    // The preceding line break belongs to the delimiter.
    let partEnd = i;
    if (partEnd > 0 && body[partEnd - 1] === LF) partEnd -= 1;
    if (partEnd > 0 && body[partEnd - 1] === CR) partEnd -= 1;
    if (partStart >= 0) children.push(body.subarray(partStart, partEnd));

    let j = i + delimiter.length;
    const closing = body[j] === 0x2d && body[j + 1] === 0x2d;
    if (closing) return children;
    // Skip transport padding and the delimiter's own line ending.
    while (j < body.length && body[j] !== LF) j++;
    partStart = j + 1;
    i = j;
  }
  if (partStart >= 0 && partStart <= body.length) children.push(body.subarray(partStart));
  return children;
}

function startsWith(haystack: Uint8Array, at: number, needle: Uint8Array): boolean {
  for (let k = 0; k < needle.length; k++) if (haystack[at + k] !== needle[k]) return false;
  return true;
}

/* ── The entry point ─────────────────────────────────────────────────────── */

export function parseMime(raw: Uint8Array | string): MimeMessage {
  const bytes = typeof raw === "string" ? new Uint8Array(Buffer.from(raw, "utf8")) : raw;
  const [headerEnd, bodyStart] = splitEntity(bytes);
  const headers = parseHeaders(latin1(bytes.subarray(0, headerEnd)));
  const body = bytes.subarray(bodyStart);

  const acc: Collected = { parts: [], attachments: [], text: null, html: null };
  const type = parseParams(header(headers, "content-type") ?? "text/plain");
  if (type.main.startsWith("multipart/") && type.params.boundary) {
    for (const child of splitMultipart(body, type.params.boundary)) walk(child, null, acc);
  } else {
    // A non-multipart message is one part whose headers are the message's
    // content-* headers.
    walk(body, headers.filter((h) => h.name.startsWith("content-")), acc);
  }

  return {
    headers,
    subject: header(headers, "subject"),
    messageId: header(headers, "message-id"),
    text: acc.text,
    html: acc.html,
    parts: acc.parts,
    attachments: acc.attachments,
  };
}
