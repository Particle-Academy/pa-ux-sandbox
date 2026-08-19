<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * The HTTP seam.
 *
 * An interface rather than a hard dependency on Guzzle, Laravel's `Http`, or
 * curl, for the reason the whole marketplace exists: a vendored node must cost
 * the consumer no new dependency. A Laravel host binds a four-line adapter over
 * `Http::send()`; anyone else implements this against whatever they already use.
 *
 * `fake` mode never reaches a transport at all — which is why a freshly vendored
 * connector runs before any of this is wired.
 */
interface Transport
{
    public function send(PreparedRequest $request): TransportResponse;
}
