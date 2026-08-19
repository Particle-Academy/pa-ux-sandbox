<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/RenderRules.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

use Closure;

/**
 * The rules a provider imposes on a message, as DATA.
 *
 * Declarative on purpose. Across the providers this was extracted from, the
 * differences that mattered were all values — the limit, the unit, whether a
 * thread mechanism exists, whether links carry byte offsets. A provider whose
 * rendering genuinely needs code implements `render()` on the connector and
 * ignores this; the point of the rule set is that most do not have to.
 */
final readonly class RenderRules
{
    /**
     * @param  int|null  $limit  the provider's limit per message, or NULL where it imposes
     *                            none. Null means UNCOUNTED and is a real answer, distinct
     *                            from "we do not know" — which is not a renderable state at
     *                            all. This must stay RESOLVABLE PER CONNECTION and never
     *                            become static: a Mastodon instance's limit comes from the
     *                            server, so baking it in renders to 500 on an instance
     *                            allowing 5000, or to 5000 on one allowing 500, and both
     *                            fail silently. {@see Render::withResolvedLimit()}
     * @param  bool  $thread  whether this provider can carry a sequence of connected
     *                        messages. FALSE means over-length content is REFUSED rather
     *                        than split — splitting would invent a structure the provider
     *                        does not have, and a numbered sequence of unconnected messages
     *                        is worse than a refusal because it looks deliberate.
     * @param  string  $label  human name, used in refusal messages
     * @param  bool  $links  include UTF-8 link ranges per segment, for providers with
     *                       rich-text spans
     * @param  Closure(int, int): string|null  $numbering  suffix added to each part of a
     *                                                     thread, given the 1-based index and the total. Defaults to
     *                                                     ` (i/n)`. Its cost is measured and subtracted from the limit
     *                                                     BEFORE splitting, because a suffix discovered afterwards is a
     *                                                     bug that only appears on long threads.
     */
    public function __construct(
        public ?int $limit,
        public TextUnit $unit,
        public bool $thread,
        public string $label,
        public bool $links = false,
        public ?Closure $numbering = null,
    ) {}

    /** The default suffix. Kept here so the cost calculation and the render agree. */
    public function number(int $index, int $total): string
    {
        return $this->numbering === null
            ? " ({$index}/{$total})"
            : ($this->numbering)($index, $total);
    }
}
