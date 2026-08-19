<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * A retry can no longer be made safe, so the write is refused.
 *
 * The provider has forgotten the idempotency key the first attempt sent, which
 * leaves no safe option: resending the key writes twice because the provider no
 * longer recognises it, and sending a fresh key writes twice by construction.
 *
 * Never retryable — a later attempt is further outside the window, not nearer
 * the inside of it. This is deliberately loud: a stuck run a person reconciles
 * is a far better outcome than a duplicate charge nobody ever sees.
 */
final class ConnectorIdempotencyExpiredException extends ConnectorException {}
