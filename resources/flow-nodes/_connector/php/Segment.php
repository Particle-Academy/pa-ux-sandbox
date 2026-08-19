<?php


// GENERATED from particle-academy/fancy-connectors — php/src/Segment.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** One message of a rendered payload, exactly as it would be sent. */
final readonly class Segment
{
    /**
     * @param  string  $text  the text of this message, exactly as it would be sent
     * @param  int  $count  how many of the provider's unit this segment uses
     * @param  list<LinkRange>|null  $links  link ranges, in UTF-8 bytes, RELATIVE TO THIS
     *                                       SEGMENT. Null where the provider has no
     *                                       rich-text spans, which is not the same as an
     *                                       empty list — that means "asked, none found".
     */
    public function __construct(
        public string $text,
        public int $count,
        public ?array $links = null,
    ) {}
}
