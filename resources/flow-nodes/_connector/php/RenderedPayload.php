<?php


// GENERATED from particle-academy/fancy-connectors — php/src/RenderedPayload.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** What a provider would ACTUALLY receive, and what an approval covers. */
final readonly class RenderedPayload
{
    /**
     * @param  list<Segment>  $segments  one entry per message. More than one means a thread.
     * @param  int|null  $limit  what the provider allows, or NULL where it imposes no limit.
     *                           Null rather than a very large number: `PHP_INT_MAX` is
     *                           arithmetically fine and reads, on a person's screen, as
     *                           `157 / 9223372036854775807` — a number pretending to be a
     *                           fact. "No limit" and "a limit so large it cannot be hit"
     *                           are different statements.
     * @param  list<string>  $problems  why this could not be rendered, when it could not.
     *                                  Never silently repaired.
     */
    public function __construct(
        public array $segments,
        public TextUnit $unit,
        public ?int $limit,
        public array $problems,
        public string $rendererVersion,
    ) {}

    /** A copy on a different renderer version. Only a test has a reason to want one. */
    public function withRendererVersion(string $version): self
    {
        return new self($this->segments, $this->unit, $this->limit, $this->problems, $version);
    }
}
