<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\UiEffect;

use Illuminate\Contracts\Broadcasting\Broadcaster;

/**
 * The host most Laravel apps want: put the effect on a broadcast channel and
 * let the browser apply it.
 *
 * The browser side is the SAME code an in-browser run uses — subscribe, and
 * hand each payload to the JS backend's DOM host:
 *
 * ```ts
 * import { createDomUiEffectHost } from "@/components/fancy/flow-nodes/ui-effect/js/dom";
 *
 * const dom = createDomUiEffectHost();
 * Echo.private(`flow.${runId}`).listen(".ui.effect", (e) => dom.apply(e.effect));
 * ```
 *
 * That symmetry is the point of the node declaring an intent instead of
 * performing a mutation: one implementation of "what a pulse means", reached
 * from either runtime.
 */
final class BroadcastUiEffectHost implements UiEffectHost
{
    public function __construct(
        private readonly Broadcaster $broadcaster,
        /** Channel the surface is listening on. */
        private readonly string $channel = 'flow',
        private readonly string $event = 'ui.effect',
    ) {}

    public function apply(UiEffect $effect): void
    {
        // No try/catch. A broadcast that fails to send has NOT applied the
        // effect, and swallowing that would leave the run reporting success
        // over a surface that never changed.
        $this->broadcaster->broadcast([$this->channel], $this->event, ['effect' => $effect->toArray()]);
    }
}
