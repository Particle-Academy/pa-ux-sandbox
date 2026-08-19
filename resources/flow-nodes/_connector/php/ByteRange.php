<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/ByteRange.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * A half-open range of UTF-8 BYTES.
 *
 * Named for the unit because the whole failure mode is somebody passing
 * character offsets into a field that wants bytes. The two are equal for ASCII,
 * which is why that mistake survives review and fails in production.
 *
 * PHP makes this easier than JavaScript does — a PHP string already IS a byte
 * string, so `strlen` is a byte count and `substr` is a byte slice. The trap
 * moves rather than disappearing: `mb_substr` and `mb_strpos` silently work in
 * CHARACTERS, and mixing one of those with a `strlen` produces exactly the
 * corruption this type exists to prevent. So a range is still only ever produced
 * by {@see Text::byteRangeOf()} or {@see Text::linkRanges()}, never by a
 * `strpos` at a call site.
 */
readonly class ByteRange
{
    public function __construct(
        public int $byteStart,
        public int $byteEnd,
    ) {}
}
