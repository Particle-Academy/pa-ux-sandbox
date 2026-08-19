<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Stripe;

use FancyFlow\Nodes\Connector\DeliveryMechanism;
use FancyFlow\Nodes\Connector\WebhookVerifier;

/**
 * Stripe's webhook trigger — the delivery contract, shared by its trigger nodes.
 *
 * Kept beside the service descriptor rather than inside a node, because a
 * signature scheme is a fact about STRIPE. Two Stripe triggers must not be able
 * to disagree about how a delivery is verified.
 *
 * The twin of `../js/trigger.ts`.
 */
final class StripeTrigger
{
    public const DELIVERY = DeliveryMechanism::Webhook;

    public const SETUP = 'Add an endpoint in the Stripe dashboard (or via POST /v1/webhook_endpoints) '
        .'pointing at the route your host mounts for this trigger, then put the endpoint\'s signing secret '
        .'on the connection as `webhookSecret`.';

    /**
     * Verify one inbound Stripe delivery.
     *
     * The host calls this BEFORE starting a run, with the body exactly as
     * received. Re-serialised JSON changes key order and whitespace and produces
     * a mismatch that looks precisely like a wrong secret — hours spent
     * debugging the wrong thing.
     *
     * @param  array<string,string|list<string>>  $headers
     * @return array{ok: bool, reason: ?string}
     */
    public static function verifyDelivery(
        string $raw,
        array $headers,
        ?string $webhookSecret,
        ?int $now = null,
    ): array {
        $header = WebhookVerifier::header($headers, Stripe::SIGNATURE_HEADER);
        $parsed = $header === null
            ? ['signature' => null, 'timestamp' => null]
            : Stripe::parseSignature($header);

        return WebhookVerifier::verify(
            raw: $raw,
            signature: $parsed['signature'],
            secret: $webhookSecret,
            payload: Stripe::signedPayload(...),
            algorithm: 'sha256',
            tolerance: Stripe::TOLERANCE,
            timestamp: $parsed['timestamp'],
            now: $now,
        );
    }
}
