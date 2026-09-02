<?php

namespace App\Support\Registry;

/**
 * Text read from a sibling repo, normalised for embedding in a compiled
 * artifact.
 *
 * ## Why this exists
 *
 * The `resources/registry/*.json` artifacts embed file content verbatim and are
 * COMMITTED, because production has no sibling repos to compile from. Embedding
 * verbatim meant embedding the line endings of whatever machine ran the build —
 * and git hands a Windows checkout CRLF and a Linux checkout LF for the very
 * same commit. So the artifact was a property of the builder's operating
 * system rather than of the source.
 *
 * That had two consequences, and the second is the expensive one:
 *
 *   * The docs site served Windows line endings inside every code sample.
 *   * The artifacts could not be verified. Rebuilding on Linux produced a
 *     different file from the committed one — registry.json by 60,188 bytes,
 *     readmes.json by exactly 16,998 (8,499 CRLF x 2) — so no check could tell
 *     "someone forgot to regenerate this" apart from "this was built on a
 *     different OS". A staleness guard is impossible while that is true.
 *
 * Normalising at the point of READ, rather than when writing the artifact, is
 * deliberate: content also flows into import parsing and manifest validation,
 * and those should not see a `\r` either.
 */
final class SourceText
{
    /**
     * Normalise line endings to `\n`.
     *
     * Handles lone `\r` (classic Mac, and what a botched merge tool leaves
     * behind) as well as CRLF, so the result is `\n`-only whatever arrived.
     */
    public static function lf(string $text): string
    {
        return str_replace(["\r\n", "\r"], "\n", $text);
    }
}
