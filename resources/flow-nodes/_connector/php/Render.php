<?php


// GENERATED from particle-academy/fancy-connectors — php/src/Render.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

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
 * So rendering happens BEFORE whatever gate the host applies: the person
 * approving sees exactly what each provider will receive and approves THAT.
 * Nothing is invented after the decision.
 *
 * ## Which forces three properties
 *
 * 1. **Pure.** Rules in, payload out. No clock, no randomness, no network. If
 *    the preview and the send could disagree, the approval means nothing.
 *    Anything variable — an instance's configured limit — is resolved by the
 *    CALLER and passed in as a rule, so it becomes part of what was approved.
 * 2. **Versioned.** Any change to how text is split, counted or faceted bumps
 *    {@see RENDERER_VERSION}, and the version is INSIDE the payload hash rather
 *    than beside it, so it cannot be checked separately and forgotten.
 * 3. **Honest about loss.** Anything that could not be fitted is reported as a
 *    problem, never quietly applied. A truncated URL is worse than a refused
 *    message, because it looks deliberate and goes somewhere wrong.
 *
 * ## And one rule about where length lives
 *
 * **No length rule outside this class.** A validator and a renderer that both
 * judge length will disagree, and then the validator refuses content the
 * renderer had already solved. A connector's `validate()` checks what the
 * renderer cannot — media, alt text, a required field — and leaves length here.
 */
final class Render
{
    /**
     * Bump on ANY change to how text is split, counted, or faceted.
     *
     * A payload approved under `render@1` refuses to send once this reads
     * `render@2`, because the payload the approver saw is no longer the payload
     * that would go out. That is the correct outcome and the reason the field
     * exists.
     */
    public const RENDERER_VERSION = 'render@1';

    /**
     * Where a sentence ends: after `.`, `!` or `?` ONLY when whitespace follows,
     * or after a newline.
     *
     * The whitespace condition is the whole point. A pattern that treats every
     * `.` as a terminator splits inside `https://example.test/x`, and the URL
     * can then land across two messages — a link that goes nowhere, from copy
     * that looked fine in review. Abbreviations survive for the same reason.
     *
     * Byte-for-byte the same rule as the TypeScript twin, including the
     * lookbehinds, so a payload hash computed on either runtime matches.
     */
    private const SENTENCE_BOUNDARY = '/(?<=[.!?])(?=\s)|(?<=\n)/u';

    /**
     * Split text into parts that each fit the limit.
     *
     * **Sentence boundaries first, then words, and never mid-grapheme.** A
     * thread that splits mid-argument is worse than one that splits a little
     * unevenly, so this prefers a natural break even when it wastes room.
     *
     * A single token that cannot fit at all is reported as a problem rather than
     * hard-cut — see the note at the top of this class about truncated URLs.
     */
    public static function splitToFit(string $text, int $limit, TextUnit $unit): SplitResult
    {
        $count = static fn (string $value): int => Text::measure($value, $unit);
        $trimmed = trim($text);

        if ($count($trimmed) <= $limit) {
            return new SplitResult($trimmed === '' ? [] : [$trimmed], []);
        }

        $problems = [];
        $parts = [];
        $current = '';

        $flush = static function () use (&$current, &$parts): void {
            if (trim($current) !== '') {
                $parts[] = trim($current);
            }
            $current = '';
        };

        // Sentence-ish units, kept WITH their punctuation: a fragment that loses
        // its full stop reads as truncated even when it is complete. Newlines
        // still split — a deliberate break is a better seam than any sentence.
        $sentences = array_values(array_filter(
            preg_split(self::SENTENCE_BOUNDARY, $trimmed) ?: [],
            static fn (string $part): bool => $part !== '',
        ));

        foreach ($sentences as $sentence) {
            $candidate = $current.$sentence;

            if ($count(trim($candidate)) <= $limit) {
                $current = $candidate;

                continue;
            }

            $flush();

            if ($count(trim($sentence)) <= $limit) {
                $current = $sentence;

                continue;
            }

            $buffer = '';
            // The delimiters are CAPTURED so the whitespace between words is
            // preserved. Dropping it and re-joining with a single space would
            // rewrite the author's text, which is a change nobody approved.
            $words = preg_split('/(\s+)/u', $sentence, -1, PREG_SPLIT_DELIM_CAPTURE) ?: [];

            foreach ($words as $word) {
                if ($count(trim($buffer.$word)) <= $limit) {
                    $buffer .= $word;

                    continue;
                }

                if (trim($buffer) !== '') {
                    $parts[] = trim($buffer);
                }
                $buffer = '';

                if ($count(trim($word)) > $limit) {
                    $head = mb_substr(trim($word), 0, 40, 'UTF-8');
                    $problems[] = sprintf(
                        '"%s…" is %d %s on its own, longer than one whole message (%d). It cannot be split '
                        .'without breaking it, so this needs rewriting rather than adapting.',
                        $head,
                        $count(trim($word)),
                        $unit->value,
                        $limit,
                    );

                    continue;
                }

                $buffer = $word;
            }

            $current = $buffer;
        }

        $flush();

        return new SplitResult(
            array_values(array_filter($parts, static fn (string $part): bool => $part !== '')),
            $problems,
        );
    }

    /**
     * Render text against a provider's rule set.
     *
     * The one entry point. A connector that needs nothing bespoke declares rules
     * and calls this; the shared behaviour — numbering cost, per-segment link
     * offsets, refusal where there is no thread mechanism — is then identical
     * everywhere, which is what makes a catalogue feel like one thing.
     */
    public static function render(string $text, RenderRules $rules): RenderedPayload
    {
        $count = static fn (string $value): int => Text::measure($value, $rules->unit);
        $trimmed = trim($text);

        if ($rules->limit === null || $count($trimmed) <= $rules->limit) {
            return new RenderedPayload(
                [self::segment($trimmed, $rules)],
                $rules->unit,
                $rules->limit,
                [],
                self::RENDERER_VERSION,
            );
        }

        if (! $rules->thread) {
            return new RenderedPayload(
                [self::segment($trimmed, $rules)],
                $rules->unit,
                $rules->limit,
                [
                    sprintf(
                        "%d %s; %s's limit is %d, and it has no thread mechanism to split into. "
                        .'This needs shortening rather than adapting.',
                        $count($trimmed),
                        $rules->unit->value,
                        $rules->label,
                        $rules->limit,
                    ),
                ],
                self::RENDERER_VERSION,
            );
        }

        $first = self::splitToFit($text, $rules->limit, $rules->unit);
        $willNumber = count($first->parts) > 1;

        // Re-split against a reduced limit when numbering will be added, so the
        // suffix is accounted for rather than discovered afterwards. `99/99` is
        // the widest realistic suffix; using the real total would need the split
        // that depends on it, which is circular.
        $suffixCost = $willNumber ? $count($rules->number(99, 99)) : 0;
        $split = $willNumber ? self::splitToFit($text, $rules->limit - $suffixCost, $rules->unit) : $first;

        $total = count($split->parts);
        $segments = [];

        foreach ($split->parts as $index => $part) {
            $withNumber = $total > 1 ? $part.$rules->number($index + 1, $total) : $part;

            // Computed per segment and never sliced from the original — an
            // offset into the whole text is meaningless once the text has been
            // split, and would point somewhere real and wrong.
            $segments[] = self::segment($withNumber, $rules);
        }

        $problems = $split->problems;
        $over = array_filter($segments, static fn (Segment $segment): bool => $segment->count > $rules->limit);

        if ($over !== []) {
            $problems[] = sprintf(
                '%d segment(s) still exceed %d %s after splitting. That is a renderer defect rather than a '
                .'content problem — the split should not produce an over-length message.',
                count($over),
                $rules->limit,
                $rules->unit->value,
            );
        }

        return new RenderedPayload($segments, $rules->unit, $rules->limit, $problems, self::RENDERER_VERSION);
    }

    /**
     * A stable fingerprint of what would actually be sent.
     *
     * This is what an approval covers. A host recomputes it at dispatch and
     * refuses on mismatch: if the rendering changed for ANY reason — edited
     * text, a changed limit, a new renderer version — the hashes differ, because
     * the approver approved a payload rather than an intention.
     *
     * ## The canonical form is a cross-runtime contract
     *
     * `{"v":"render@1","segments":["…"]}`, with slashes and non-ASCII left
     * unescaped, which is exactly what `JSON.stringify` produces. A host may
     * render on PHP and verify on Node, or the reverse, so a difference here
     * would show up as an approval that refuses to dispatch for no visible
     * reason. `php/tests/RenderTest.php` pins the digest against a value
     * computed by running the TypeScript.
     */
    public static function payloadHash(RenderedPayload $payload): string
    {
        $canonical = json_encode(
            [
                // Inside the hash, deliberately — see RENDERER_VERSION.
                'v' => $payload->rendererVersion,
                'segments' => array_map(static fn (Segment $segment): string => $segment->text, $payload->segments),
            ],
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR,
        );

        return hash('sha256', $canonical);
    }

    /**
     * Refuse empty content, centrally.
     *
     * The sha of the empty string is a valid sha, so an empty payload passes
     * every byte-verification a host can write. Refusing it in one place is what
     * stops every one of those checks from being hollow.
     */
    public static function isEmptyPayload(RenderedPayload $payload): bool
    {
        foreach ($payload->segments as $segment) {
            if (trim($segment->text) !== '') {
                return false;
            }
        }

        return true;
    }

    private static function segment(string $text, RenderRules $rules): Segment
    {
        return new Segment(
            $text,
            Text::measure($text, $rules->unit),
            $rules->links ? Text::linkRanges($text) : null,
        );
    }
}
