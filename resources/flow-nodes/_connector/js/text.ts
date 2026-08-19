// GENERATED from @particle-academy/fancy-connectors — src/text.ts
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.

/**
 * Measuring and slicing text the way providers actually measure and slice it.
 *
 * ## Why a package owns this at all
 *
 * Two of the nastiest bugs in a connector catalogue are one-liners, and both
 * come from reaching for the obvious JavaScript idiom:
 *
 * 1. **`text.length` is not a count of anything a provider limits.** It counts
 *    UTF-16 code units. `"👍".length` is 2 and `"👨‍👩‍👧".length` is 8, so it
 *    overcounts exactly the posts most likely to sit near a limit — and it fails
 *    in the worse direction, because a post that passes our check and is then
 *    refused by the server reads as the network being flaky rather than as our
 *    bug.
 * 2. **`indexOf` returns a character index, and rich-text formats want BYTES.**
 *    AT Protocol facets are UTF-8 byte ranges. An implementation using character
 *    indices is correct for ASCII and silently corrupts every post containing an
 *    emoji or an accent — and it corrupts the *link*, so the post looks fine and
 *    the link goes somewhere wrong.
 *
 * Neither is discoverable by testing with ASCII, which is what everyone tests
 * with. So the package makes the wrong thing unreachable: a `ByteRange` is a
 * type, not a convention, and it can only be produced by a function that
 * encoded the string.
 *
 * ## The unit is declared, never assumed
 *
 * Providers count different things — Bluesky counts graphemes, Discord and
 * Telegram count characters, some count bytes. `TextUnit` makes the choice
 * explicit at the point a limit is declared, so nobody has to remember which
 * network is which.
 */

/** What a provider actually counts. Declared per connector, never guessed. */
export type TextUnit = "graphemes" | "characters" | "utf8-bytes";

/**
 * A half-open range of UTF-8 BYTES.
 *
 * Named for the unit because the whole failure mode is somebody passing
 * character offsets into a field that wants bytes. The two are equal for ASCII,
 * which is why this survives review and fails in production.
 */
export type ByteRange = {
  byteStart: number;
  byteEnd: number;
};

const encoder = new TextEncoder();

/**
 * Count graphemes — what a person means by "characters".
 *
 * `Intl.Segmenter` is the correct tool and has been in Node since 16. The
 * fallback is the spread operator, which counts code points rather than UTF-16
 * units and so is wrong by less. Both are better than `.length`.
 */
export function graphemes(text: string): number {
  const Segmenter = (
    Intl as unknown as {
      Segmenter?: new (locale?: string, options?: object) => { segment(input: string): Iterable<unknown> };
    }
  ).Segmenter;

  if (!Segmenter) return [...text].length;

  let count = 0;
  for (const _ of new Segmenter(undefined, { granularity: "grapheme" }).segment(text)) count++;

  return count;
}

/** Length of `text` in UTF-8 bytes. */
export function utf8Length(text: string): number {
  return encoder.encode(text).length;
}

/**
 * Count `text` in whichever unit a provider enforces.
 *
 * The one function every limit check goes through, so a connector never has to
 * decide — and so `text.length` never appears in connector source at all.
 */
export function measure(text: string, unit: TextUnit): number {
  if (unit === "graphemes") return graphemes(text);
  if (unit === "utf8-bytes") return utf8Length(text);

  return text.length;
}

/**
 * The UTF-8 byte range of a substring that starts at a CHARACTER index.
 *
 * The bridge between the index a regex gives you and the offsets a provider
 * wants. Takes the character index because that is what `matchAll` produces, and
 * returns bytes because that is what goes on the wire — doing the conversion in
 * one place is the entire point.
 */
export function byteRangeOf(text: string, charIndex: number, substring: string): ByteRange {
  const byteStart = utf8Length(text.slice(0, charIndex));

  return { byteStart, byteEnd: byteStart + utf8Length(substring) };
}

/**
 * Extract the substring a byte range names.
 *
 * Exists so a test can prove a range points where it claims to, which is the
 * only way to catch an off-by-one that ASCII hides. A range that lands
 * mid-character yields the replacement character rather than throwing, because
 * the useful failure here is a visibly wrong string in an assertion, not an
 * exception three frames away.
 */
export function sliceByteRange(text: string, range: ByteRange): string {
  const bytes = encoder.encode(text);

  return new TextDecoder().decode(bytes.slice(range.byteStart, range.byteEnd));
}

/**
 * Bare URLs in `text`, with their UTF-8 byte ranges.
 *
 * Trailing punctuation is excluded: a link at the end of a sentence would
 * otherwise swallow the full stop and 404. Closing brackets go too, for the same
 * reason and because a URL in parentheses is common in prose.
 *
 * This is the generic half of a "link facet" — a connector maps the ranges into
 * whatever its provider's rich-text shape is. The package owns the offsets
 * because the offsets are what people get wrong; it does not own the provider's
 * schema, because that is the provider's.
 */
export function linkRanges(text: string): Array<ByteRange & { url: string }> {
  const found: Array<ByteRange & { url: string }> = [];

  for (const match of text.matchAll(/https?:\/\/[^\s]+/g)) {
    if (match.index === undefined) continue;
    const url = match[0].replace(/[.,;:!?)\]}'"]+$/, "");
    found.push({ ...byteRangeOf(text, match.index, url), url });
  }

  return found;
}
