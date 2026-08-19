<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Stripe;

use FancyFlow\Nodes\Connector\Mode;
use FancyFlow\Nodes\Connector\PreparedRequest;
use FancyFlow\Nodes\Connector\SandboxKind;
use FancyFlow\Nodes\Connector\ServiceDescriptor;

/**
 * Stripe, as one service descriptor shared by every Stripe node.
 *
 * The PHP twin of `../js/service.ts`. `_connector` carries what is true of ALL
 * connectors; this carries what is true of Stripe — its base URL, auth scheme,
 * idempotency header, webhook signature format, and faker. Six Stripe nodes
 * would otherwise retype all of it six times, and the day Stripe changes
 * something five of the six would keep the old answer.
 *
 * ## The sandbox trap, written down where it is used
 *
 * Stripe's test estate is selected by the KEY, not by the URL — `api.stripe.com`
 * serves both. A live key sent to a node whose mode says "sandbox" reaches the
 * real ledger and succeeds. Nothing in the request distinguishes them, which is
 * exactly why credentials sit on the connection rather than on twelve nodes.
 */
final class Stripe
{
    public const API = 'https://api.stripe.com';

    /** Header carrying `t=…,v1=…`. */
    public const SIGNATURE_HEADER = 'Stripe-Signature';

    /** Stripe's documented replay window, in seconds. */
    public const TOLERANCE = 300;

    public static function descriptor(): ServiceDescriptor
    {
        return new ServiceDescriptor(
            service: 'stripe',
            title: 'Stripe',
            // Same host for both estates — the key decides. See the note above.
            sandbox: SandboxKind::Credential,
            baseUrls: [Mode::Live->value => self::API, Mode::Sandbox->value => self::API],
            requires: ['secretKey'],
            // Bearer, not Basic. Stripe accepts the key as a Basic username too,
            // and both are documented, but one spelling in one place is one
            // fewer thing to get subtly wrong.
            authorize: static function (array $credentials, PreparedRequest $request, Mode $mode): void {
                $request->withHeader('Authorization', 'Bearer '.($credentials['secretKey'] ?? ''));
            },
            faker: StripeFaker::respond(...),
            // Retried durable runs MUST not create a second charge. This header
            // is what makes `unsafe-to-replay` recoverable rather than merely
            // forbidden.
            idempotencyHeader: 'Idempotency-Key',
        );
    }

    /**
     * Split `t=…,v1=…` into its parts.
     *
     * The timestamp travels INSIDE the signature header rather than in one of
     * its own, so it has to be parsed out before the HMAC can be checked.
     * Stripe may send several `v1` values during a secret rotation; the first is
     * taken, because failing over to a second makes "which one matched"
     * ambiguous for a window that is rare and short.
     *
     * @return array{signature: ?string, timestamp: ?string}
     */
    public static function parseSignature(string $raw): array
    {
        $result = ['signature' => null, 'timestamp' => null];

        foreach (explode(',', $raw) as $part) {
            $pair = explode('=', trim($part), 2);
            if (count($pair) !== 2) {
                continue;
            }

            if ($pair[0] === 't') {
                $result['timestamp'] = $pair[1];
            }
            if ($pair[0] === 'v1' && $result['signature'] === null) {
                $result['signature'] = $pair[1];
            }
        }

        return $result;
    }

    /** The exact bytes Stripe signs: `{timestamp}.{rawBody}`. */
    public static function signedPayload(string $raw, ?string $timestamp): string
    {
        return $timestamp.'.'.$raw;
    }
}
