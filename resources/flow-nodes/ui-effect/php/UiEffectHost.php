<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\UiEffect;

/**
 * The seam between "a workflow decided the card should glow" and "a browser
 * somewhere made it glow".
 *
 * PHP has no DOM. A `ui_effect` node running on a queue worker cannot apply
 * anything itself — it can only deliver the intent to whatever surface is
 * listening. That is not a limitation to work around; it is the same
 * arrangement the TypeScript side uses in a worker, and it is why the node
 * declares an intent rather than performing a mutation.
 *
 * The shipped {@see BroadcastUiEffectHost} sends it over Laravel broadcasting.
 * Implement this yourself for a different transport — an SSE stream, a
 * long-poll relay, a websocket you already own.
 */
interface UiEffectHost
{
    /**
     * Deliver the effect to the surface.
     *
     * THROW if it cannot be delivered. Do not swallow it: a run that reports
     * success having styled nothing is the failure this whole node is arranged
     * against, and on a queue worker nobody is watching to notice.
     */
    public function apply(UiEffect $effect): void;
}
