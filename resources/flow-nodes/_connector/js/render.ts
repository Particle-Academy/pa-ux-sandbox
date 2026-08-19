// GENERATED from @particle-academy/fancy-connector-core — src/render.ts
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.

/**
 * Rendering — what a provider would ACTUALLY receive.
 *
 * ## Why a connector package owns this, and why it is dangerous
 *
 * One piece of content often has to reach several providers whose limits are
 * incompatible. Without adaptation the same text is wasteful on one and refused
 * by another. With naive adaptation, the bytes that reach the public are not the
 * bytes anyone approved — and every guarantee a host makes about approval
 * becomes a lie the moment adaptation exists.
 *
 * So rendering happens **before** whatever gate the host applies: the person
 * approving sees exactly what each provider will receive and approves *that*.
 * Nothing is invented after the decision.
 *
 * ## Which forces three properties
 *
 * 1. **Pure.** Rules in, payload out. No clock, no randomness, no network. If
 *    the preview and the send could disagree, the approval means nothing.
 *    Anything variable — an instance's configured limit — is resolved by the
 *    CALLER and passed in as a rule, so it becomes part of what was approved.
 * 2. **Versioned.** Any change to how text is split, counted or faceted bumps
 *    `RENDERER_VERSION`, and the version is **inside** the payload hash rather
 *    than beside it, so it cannot be checked separately and forgotten.
 * 3. **Honest about loss.** Anything that could not be fitted is reported as a
 *    problem, never quietly applied. A truncated URL is worse than a refused
 *    post, because it looks deliberate and goes somewhere wrong.
 *
 * ## And one rule about where length lives
 *
 * **No length rule outside this module.** A validator and a renderer that both
 * judge length will disagree, and then the validator refuses content the
 * renderer had already solved. `validate()` on a connector checks things the
 * renderer cannot — media, alt text, a required field — and leaves length here.
 */

import { linkRanges, measure, type ByteRange, type TextUnit } from "./text";

/**
 * Bump on ANY change to how text is split, counted, or faceted.
 *
 * A payload approved under `1` refuses to send once this reads `2`, because the
 * payload the approver saw is no longer the payload that would go out. That is
 * the correct outcome and the reason the field exists.
 */
export const RENDERER_VERSION = "render@1";

export type Segment = {
  /** The text of this message, exactly as it would be sent. */
  text: string;
  /** How many of the provider's unit this segment uses. */
  count: number;
  /** Link ranges, in UTF-8 bytes, **relative to this segment**. */
  links?: Array<ByteRange & { url: string }>;
};

export type RenderedPayload = {
  /** One entry per message. More than one means a thread. */
  segments: Segment[];
  /** What the provider counts, so a preview can label the number. */
  unit: TextUnit;
  /**
   * What the provider allows, or **null where it imposes no limit**.
   *
   * Null rather than a very large number: `Number.MAX_SAFE_INTEGER` is
   * arithmetically fine and reads, on a person's screen, as
   * `157 / 9007199254740991` — a number pretending to be a fact. "No limit" and
   * "a limit so large it cannot be hit" are different statements.
   */
  limit: number | null;
  /** Why this could not be rendered, when it could not. Never silently repaired. */
  problems: string[];
  rendererVersion: string;
};

/**
 * The rules a provider imposes on a message, as DATA.
 *
 * Declarative on purpose. Across the providers this was extracted from, the
 * differences that mattered were all values — the limit, the unit, whether a
 * thread mechanism exists, whether links carry byte offsets. A provider whose
 * rendering genuinely needs code supplies its own `render` on the connector and
 * ignores this; the point of the rule set is that most do not have to.
 */
export type RenderRules = {
  /** The provider's limit per message, or null where it has none. */
  limit: number | null;
  unit: TextUnit;
  /**
   * Whether this provider can carry a sequence of connected messages.
   *
   * False means over-length content is REFUSED rather than split — splitting
   * would invent a structure the provider does not have, and a numbered sequence
   * of unconnected messages is worse than a refusal because it looks deliberate.
   */
  thread: boolean;
  /** Include UTF-8 link ranges per segment, for providers with rich-text spans. */
  links?: boolean;
  /** Human name, used in refusal messages. */
  label: string;
  /**
   * Suffix added to each part of a thread, given the 1-based index and total.
   *
   * Defaults to ` (i/n)`. Its cost is measured and subtracted from the limit
   * BEFORE splitting, because a suffix discovered afterwards is a bug that only
   * appears on long threads.
   */
  numbering?: (index: number, total: number) => string;
};

const defaultNumbering = (index: number, total: number): string => ` (${index}/${total})`;

/**
 * Where a sentence ends: after `.`, `!` or `?` **only when whitespace follows**,
 * or after a newline.
 *
 * The whitespace condition is the whole point. A regex that treats every `.` as
 * a terminator splits inside `https://example.test/x`, and the URL can then land
 * across two messages — a link that goes nowhere, from copy that looked fine in
 * review. Abbreviations survive for the same reason.
 */
const SENTENCE_BOUNDARY = /(?<=[.!?])(?=\s)|(?<=\n)/;

/**
 * Split text into parts that each fit the limit.
 *
 * **Sentence boundaries first, then words, and never mid-grapheme.** A thread
 * that splits mid-argument is worse than one that splits a little unevenly, so
 * this prefers a natural break even when it wastes room.
 *
 * A single token that cannot fit at all is reported as a problem rather than
 * hard-cut — see the module note about truncated URLs.
 */
export function splitToFit(
  text: string,
  limit: number,
  unit: TextUnit,
): { parts: string[]; problems: string[] } {
  const count = (value: string): number => measure(value, unit);
  const trimmed = text.trim();

  if (count(trimmed) <= limit) return { parts: trimmed === "" ? [] : [trimmed], problems: [] };

  const problems: string[] = [];
  const parts: string[] = [];

  // Sentence-ish units, kept WITH their punctuation: a fragment that loses its
  // full stop reads as truncated even when it is complete.
  //
  // **A terminator only ends a sentence when whitespace or the end follows it.**
  // The obvious sentence regex splits inside `https://example.test/x`, and a
  // URL can then land across two messages — a link that goes nowhere, from copy
  // that looked fine in review. Abbreviations survive for the same reason.
  // Newlines still split: a deliberate break is a better seam than any sentence.
  const sentences = trimmed.split(SENTENCE_BOUNDARY).filter((part) => part !== "");

  let current = "";
  const flush = (): void => {
    if (current.trim() !== "") parts.push(current.trim());
    current = "";
  };

  for (const sentence of sentences) {
    const candidate = current + sentence;

    if (count(candidate.trim()) <= limit) {
      current = candidate;
      continue;
    }

    flush();

    if (count(sentence.trim()) <= limit) {
      current = sentence;
      continue;
    }

    let buffer = "";
    for (const word of sentence.split(/(\s+)/)) {
      if (count((buffer + word).trim()) <= limit) {
        buffer += word;
        continue;
      }

      if (buffer.trim() !== "") parts.push(buffer.trim());
      buffer = "";

      if (count(word.trim()) > limit) {
        problems.push(
          `"${word.trim().slice(0, 40)}…" is ${count(word.trim())} ${unit} on its own, longer than one whole ` +
            `message (${limit}). It cannot be split without breaking it, so this needs rewriting rather than adapting.`,
        );
        continue;
      }

      buffer = word;
    }

    current = buffer;
  }

  flush();

  return { parts: parts.filter((part) => part !== ""), problems };
}

/**
 * Render text against a provider's rule set.
 *
 * The one entry point. A connector that needs nothing bespoke declares rules and
 * calls this; the shared behaviour — numbering cost, per-segment link offsets,
 * refusal where there is no thread mechanism — is then identical everywhere,
 * which is what makes a catalogue feel like one thing.
 */
export function render(text: string, rules: RenderRules): RenderedPayload {
  const { limit, unit, label } = rules;
  const count = (value: string): number => measure(value, unit);
  const trimmed = text.trim();

  if (limit === null || count(trimmed) <= limit) {
    return {
      segments: [{ text: trimmed, count: count(trimmed), ...(rules.links ? { links: linkRanges(trimmed) } : {}) }],
      unit,
      limit,
      problems: [],
      rendererVersion: RENDERER_VERSION,
    };
  }

  if (!rules.thread) {
    return {
      segments: [{ text: trimmed, count: count(trimmed), ...(rules.links ? { links: linkRanges(trimmed) } : {}) }],
      unit,
      limit,
      problems: [
        `${count(trimmed)} ${unit}; ${label}'s limit is ${limit}, and it has no thread mechanism to split into. ` +
          "This needs shortening rather than adapting.",
      ],
      rendererVersion: RENDERER_VERSION,
    };
  }

  const numbering = rules.numbering ?? defaultNumbering;
  const first = splitToFit(text, limit, unit);
  const willNumber = first.parts.length > 1;

  // Re-split against a reduced limit when numbering will be added, so the suffix
  // is accounted for rather than discovered afterwards. `99/99` is the widest
  // realistic suffix; using the real total would need the split that depends on
  // it, which is circular.
  const suffixCost = willNumber ? count(numbering(99, 99)) : 0;
  const { parts, problems } = willNumber ? splitToFit(text, limit - suffixCost, unit) : first;

  const segments: Segment[] = parts.map((part, index) => {
    const withNumber = parts.length > 1 ? `${part}${numbering(index + 1, parts.length)}` : part;

    return {
      text: withNumber,
      count: count(withNumber),
      // Computed per segment and never sliced from the original — an offset into
      // the whole text is meaningless once the text has been split.
      ...(rules.links ? { links: linkRanges(withNumber) } : {}),
    };
  });

  const over = segments.filter((segment) => segment.count > limit);
  if (over.length > 0) {
    problems.push(
      `${over.length} segment(s) still exceed ${limit} ${unit} after splitting. That is a renderer defect rather ` +
        "than a content problem — the split should not produce an over-length message.",
    );
  }

  return { segments, unit, limit, problems, rendererVersion: RENDERER_VERSION };
}

/**
 * A stable fingerprint of what would actually be sent.
 *
 * This is what an approval covers. A host recomputes it at dispatch and refuses
 * on mismatch: if the rendering changed for ANY reason — edited text, a changed
 * limit, a new renderer version — the hashes differ, because the approver
 * approved a payload rather than an intention.
 *
 * Async because it uses WebCrypto, which is the only hash available on every
 * runtime the suite supports. A host that wants it synchronously should hold the
 * value rather than recompute it.
 */
export async function payloadHash(payload: RenderedPayload): Promise<string> {
  const subtle = globalThis.crypto?.subtle;

  if (!subtle) {
    throw new Error(
      "WebCrypto is not available in this runtime, so a payload hash cannot be computed. " +
        "Refusing rather than returning a weaker fingerprint that a host would trust equally.",
    );
  }

  const canonical = JSON.stringify({
    // Inside the hash, deliberately — see RENDERER_VERSION.
    v: payload.rendererVersion,
    segments: payload.segments.map((segment) => segment.text),
  });

  const digest = await subtle.digest("SHA-256", new TextEncoder().encode(canonical));

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Refuse empty content, centrally.
 *
 * The sha of the empty string is a valid sha, so an empty payload passes every
 * byte-verification a host can write. Refusing it in one place is what stops
 * every one of those checks from being hollow.
 */
export function isEmptyPayload(payload: RenderedPayload): boolean {
  return payload.segments.every((segment) => segment.text.trim() === "");
}
