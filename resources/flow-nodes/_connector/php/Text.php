<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/Text.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * Measuring and slicing text the way providers actually measure and slice it.
 *
 * ## Why a package owns this at all
 *
 * Two of the nastiest bugs in a connector catalogue are one-liners, and both
 * come from reaching for the obvious idiom:
 *
 * 1. **A length is not a count of anything a provider limits.** `strlen` counts
 *    BYTES, so `strlen('👍')` is 4 and every accented character overcounts;
 *    `mb_strlen` counts code points, so a family emoji counts as 5. Both
 *    overcount exactly the messages most likely to sit near a limit, and both
 *    fail in the worse direction — a message that passes our check and is then
 *    refused by the server reads as the network being flaky rather than as our
 *    bug.
 * 2. **`strpos` gives a byte offset and `mb_strpos` gives a character offset,
 *    and reaching for whichever is nearer produces a range that is right for
 *    ASCII and wrong for everything else.** AT Protocol facets are UTF-8 byte
 *    ranges; an implementation using character indices silently corrupts every
 *    post containing an emoji or an accent — and it corrupts the LINK, so the
 *    post looks fine and goes somewhere wrong.
 *
 * PHP is in one respect kinder here than JavaScript: strings are already byte
 * strings, so the byte answer is the DEFAULT rather than something you have to
 * encode for. That makes the second bug easier to avoid and no less fatal when
 * it happens, which is why the offsets are still produced by a function that
 * knows what it is counting — never by a `strpos` at a call site.
 *
 * Neither bug is discoverable by testing with ASCII, which is what everyone
 * tests with.
 */
final class Text
{
    /**
     * Count graphemes — what a person means by "characters".
     *
     * `grapheme_strlen` (ext-intl) is the correct tool and matches
     * `Intl.Segmenter` on the TypeScript side. The fallback is `\X`, PCRE's
     * extended-grapheme-cluster escape, which agrees with intl on everything a
     * connector realistically sends and is wrong by less than any length
     * function. Both are enormously better than a bare `strlen`.
     */
    public static function graphemes(string $text): int
    {
        if (function_exists('grapheme_strlen')) {
            $count = grapheme_strlen($text);

            if (is_int($count)) {
                return $count;
            }
        }

        return (int) preg_match_all('/\X/u', $text);
    }

    /** Length of `$text` in UTF-8 bytes. In PHP that is simply its length. */
    public static function utf8Length(string $text): int
    {
        return strlen($text);
    }

    /**
     * Count `$text` in whichever unit a provider enforces.
     *
     * The one function every limit check goes through, so a connector never has
     * to decide — and so a bare `strlen` never appears in connector source at
     * all.
     */
    public static function measure(string $text, TextUnit $unit): int
    {
        return match ($unit) {
            TextUnit::Graphemes => self::graphemes($text),
            TextUnit::Utf8Bytes => self::utf8Length($text),
            TextUnit::Characters => mb_strlen($text, 'UTF-8'),
        };
    }

    /**
     * The UTF-8 byte range of a substring that starts at a CHARACTER index.
     *
     * The bridge between the index a `preg_match` on a multibyte string hands
     * you and the offsets a provider wants. Takes the character index because
     * that is what a caller usually has, and returns bytes because that is what
     * goes on the wire — doing the conversion in one place is the entire point.
     */
    public static function byteRangeOf(string $text, int $charIndex, string $substring): ByteRange
    {
        $byteStart = self::utf8Length(mb_substr($text, 0, $charIndex, 'UTF-8'));

        return new ByteRange($byteStart, $byteStart + self::utf8Length($substring));
    }

    /**
     * Extract the substring a byte range names.
     *
     * Exists so a test can prove a range points where it claims to, which is the
     * only way to catch an off-by-one that ASCII hides. A range that lands
     * mid-character yields the broken bytes rather than throwing, because the
     * useful failure here is a visibly wrong string in an assertion, not an
     * exception three frames away.
     */
    public static function sliceByteRange(string $text, ByteRange $range): string
    {
        return substr($text, $range->byteStart, $range->byteEnd - $range->byteStart);
    }

    /**
     * Bare URLs in `$text`, with their UTF-8 byte ranges.
     *
     * Trailing punctuation is excluded: a link at the end of a sentence would
     * otherwise swallow the full stop and 404. Closing brackets go too, for the
     * same reason and because a URL in parentheses is common in prose.
     *
     * @return list<LinkRange>
     */
    public static function linkRanges(string $text): array
    {
        $found = [];

        // PREG_OFFSET_CAPTURE gives BYTE offsets, which is exactly what is
        // wanted here — no character/byte conversion happens at all, so there is
        // nothing to get backwards.
        if (preg_match_all('/https?:\/\/\S+/u', $text, $matches, PREG_OFFSET_CAPTURE) === 0) {
            return [];
        }

        foreach ($matches[0] as [$match, $byteStart]) {
            $url = preg_replace('/[.,;:!?)\]}\'"]+$/u', '', $match) ?? $match;

            $found[] = new LinkRange($byteStart, $byteStart + self::utf8Length($url), $url);
        }

        return $found;
    }
}
