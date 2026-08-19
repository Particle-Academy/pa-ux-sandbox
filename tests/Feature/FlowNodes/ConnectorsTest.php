<?php

declare(strict_types=1);

use FancyFlow\Nodes\Connector\ConnectionHost;
use FancyFlow\Nodes\Connector\ConnectionSpec;
use FancyFlow\Nodes\Connector\ConnectorClient;
use FancyFlow\Nodes\Connector\ConnectorConfigException;
use FancyFlow\Nodes\Connector\ConnectorIdempotencyExpiredException;
use FancyFlow\Nodes\Connector\ConnectorModeException;
use FancyFlow\Nodes\Connector\Idempotency;
use FancyFlow\Nodes\Connector\FakeValues;
use FancyFlow\Nodes\Connector\HttpErrors;
use FancyFlow\Nodes\Connector\Mode;
use FancyFlow\Nodes\Connector\ModeResolver;
use FancyFlow\Nodes\Connector\SandboxKind;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\RunIdentity;
use FancyFlow\Schema\FlowNode;
use FancyFlow\Nodes\ResendEmailSend\ResendEmailSendExecutor;
use FancyFlow\Nodes\Stripe\Stripe;
use FancyFlow\Nodes\Stripe\StripeTrigger;
use FancyFlow\Nodes\StripePaymentIntent\StripePaymentIntentExecutor;
use FancyFlow\Nodes\StripeWebhookTrigger\StripeWebhookTriggerExecutor;
use FancyFlow\Nodes\TelegramUpdatesTrigger\TelegramUpdatesTriggerExecutor;

/**
 * The PHP backends of the connector exemplars, against the SAME golden fixtures
 * the TypeScript ones run.
 *
 * **No network, ever.** Every case runs in `fake` mode — which is not a
 * concession the tests make but the mode a consumer develops in, so these
 * exercise the same code path production uses.
 *
 * The cases that assert an exact `value` are the important ones. They pin the
 * two fakers to byte-identical output, which is what makes cross-runtime parity
 * a test result rather than a claim: a divergence in the seed, the generator, or
 * the order of the helper calls fails HERE rather than surfacing months later as
 * a graph that behaves differently on one backend.
 */
function connectorCtx(string $kind, array $config, mixed $input = null): ExecutionContext
{
    return new ExecutionContext(
        node: new FlowNode(id: 'subject', type: $kind, config: $config),
        inputs: ['in' => $input],
        emit: static fn () => null,
    );
}

/** A client with NO connections — the state a freshly vendored node starts in. */
function unconfiguredClient(): ConnectorClient
{
    return new ConnectorClient(new ConnectionHost(production: false));
}

dataset('connector nodes', [
    'stripe-payment-intent' => ['stripe-payment-intent', StripePaymentIntentExecutor::class],
    'stripe-webhook-trigger' => ['stripe-webhook-trigger', StripeWebhookTriggerExecutor::class],
    'resend-email-send' => ['resend-email-send', ResendEmailSendExecutor::class],
    'telegram-updates-trigger' => ['telegram-updates-trigger', TelegramUpdatesTriggerExecutor::class],
]);

it('runs every golden fixture the TypeScript backend runs', function (string $dir, string $executorClass) {
    $manifest = json_decode((string) file_get_contents(__DIR__."/../../../resources/flow-nodes/{$dir}/fancy-flow.node.json"), true);
    $file = json_decode((string) file_get_contents(__DIR__.'/../../../resources/flow-nodes/'.preg_replace('#^nodes/#', '', $manifest['fixtures'])), true);

    // The webhook trigger takes a ConnectionHost; the others take a
    // ConnectorClient. Both are unconfigured, which is the point: `fake` needs
    // no host at all.
    $executor = $executorClass === StripeWebhookTriggerExecutor::class
        ? new $executorClass(new ConnectionHost(production: false))
        : new $executorClass(unconfiguredClient());

    expect($file['cases'])->not->toBeEmpty();

    foreach ($file['cases'] as $case) {
        $expected = $case['expect'];
        $config = $case['config'] ?? [];

        if (isset($expected['error'])) {
            $thrown = null;
            try {
                $executor->execute(connectorCtx($manifest['kind'], $config));
            } catch (Throwable $e) {
                $thrown = $e;
            }

            // The message, not merely "it threw". Both runtimes explaining one
            // bad config the SAME way is the parity claim.
            expect($thrown)->not->toBeNull("case: {$case['name']} did not throw");
            expect($thrown->getMessage())->toContain($expected['error']);

            continue;
        }

        $out = $executor->execute(connectorCtx($manifest['kind'], $config));
        $port = is_array($out) && isset($out['__port']) ? $out['__port'] : 'out';
        $value = is_array($out) && array_key_exists('value', $out) ? $out['value'] : $out;

        if (isset($expected['ports'])) {
            expect($port)->toBe($expected['ports'][0], "case: {$case['name']}");
        }

        if (array_key_exists('value', $expected)) {
            // Exact equality, on purpose. This is the faker parity assertion.
            expect($value)->toBe($expected['value'], "case: {$case['name']}");
        }
    }
})->with('connector nodes');

/**
 * The sandbox/live rule, as a table.
 *
 * The single most consequential decision in the connector pattern — getting it
 * wrong means a workflow talks to a real ledger while its author believes
 * otherwise — so it is asserted case by case rather than sampled, and it must
 * agree with `tests/js/flow-nodes/connectors/core.test.ts` line for line.
 */
describe('mode resolution', function () {
    it('defaults a local project to the provider sandbox', function () {
        expect(ModeResolver::resolve(null, null, SandboxKind::Credential, true, false))->toBe(Mode::Sandbox);
    });

    it('defaults production to live', function () {
        expect(ModeResolver::resolve(null, null, SandboxKind::Credential, true, true))->toBe(Mode::Live);
    });

    it('honours an explicit live on a LOCAL project — the environment is a default, not a cage', function () {
        expect(ModeResolver::resolve(Mode::Live, null, SandboxKind::Credential, true, false))->toBe(Mode::Live);
    });

    it('honours an explicit sandbox in PRODUCTION, so a connector can be staged before cutover', function () {
        expect(ModeResolver::resolve(Mode::Sandbox, null, SandboxKind::Credential, true, true))->toBe(Mode::Sandbox);
    });

    it('lets a connection pin a mode, but an explicit ask still beats it', function () {
        expect(ModeResolver::resolve(null, Mode::Live, SandboxKind::Credential, true, false))->toBe(Mode::Live);
        expect(ModeResolver::resolve(Mode::Fake, Mode::Live, SandboxKind::Credential, true, false))->toBe(Mode::Fake);
    });

    it('falls through to fake locally when the sandbox is not wired', function () {
        expect(ModeResolver::resolve(null, null, SandboxKind::Credential, false, false))->toBe(Mode::Fake);
    });

    it('falls through to fake locally when the provider HAS no sandbox', function () {
        expect(ModeResolver::resolve(null, null, SandboxKind::None, false, false))->toBe(Mode::Fake);
    });

    it('still goes live in production when the provider has no sandbox', function () {
        expect(ModeResolver::resolve(null, null, SandboxKind::None, false, true))->toBe(Mode::Live);
    });

    it('refuses a sandbox the provider does not have, rather than quietly substituting one', function () {
        expect(fn () => ModeResolver::resolve(Mode::Sandbox, null, SandboxKind::None, false, false))
            ->toThrow(ConnectorModeException::class);
    });
});

describe('connection resolution', function () {
    $options = ['stripe', 'payment_intent_create', SandboxKind::Credential, ['secretKey']];

    it('resolves to fake with no connections at all, so a vendored node runs before anything is configured', function () {
        $connection = (new ConnectionHost)->resolve('stripe', 'op', [], SandboxKind::Credential, ['secretKey']);

        expect($connection->mode)->toBe(Mode::Fake);
        expect($connection->credentials)->toBe([]);
    });

    it('refuses a remote mode with no connection instead of silently faking it', function () {
        expect(fn () => (new ConnectionHost)->resolve(
            'stripe', 'op', ['mode' => 'live'], SandboxKind::Credential, ['secretKey'],
        ))->toThrow(ConnectorConfigException::class);
    });

    it('NEVER falls back to the faker when a remote mode is missing its credentials', function () {
        // The failure this whole design exists to prevent: a run that
        // "succeeded" because it quietly stopped talking to the provider.
        $host = new ConnectionHost(
            production: true,
            connections: ['stripe' => new ConnectionSpec(service: 'stripe', live: [])],
        );

        expect(fn () => $host->resolve('stripe', 'op', [], SandboxKind::Credential, ['secretKey']))
            ->toThrow(ConnectorConfigException::class, 'has no secretKey for live mode');
    });

    it('refuses a connection configured for a different service', function () {
        $host = new ConnectionHost(connections: ['stripe' => new ConnectionSpec(service: 'slack')]);

        expect(fn () => $host->resolve('stripe', 'op', [], SandboxKind::Credential, ['secretKey']))
            ->toThrow(ConnectorConfigException::class, 'configured for the "slack" service');
    });

    it('picks the sandbox credentials for sandbox mode and the live ones for live', function () {
        // Values here are test fixtures, not credentials: nothing about them is
        // shaped like a real key, and nothing in this repo ever holds one.
        $host = new ConnectionHost(connections: ['stripe' => new ConnectionSpec(
            service: 'stripe',
            live: ['secretKey' => 'live-value'],
            sandbox: ['secretKey' => 'sandbox-value'],
        )]);

        expect($host->resolve('stripe', 'op', [], SandboxKind::Credential, ['secretKey'])->credentials['secretKey'])
            ->toBe('sandbox-value');
        expect($host->resolve('stripe', 'op', ['mode' => 'live'], SandboxKind::Credential, ['secretKey'])->credentials['secretKey'])
            ->toBe('live-value');
    });
});

describe('the faker is deterministic', function () {
    it('gives the same values for the same inputs and different ones for different inputs', function () {
        // Captured before comparing: each call ADVANCES the generator, so
        // asserting on `$a->id('pi')` twice would be comparing two different
        // values and the test would pass for the wrong reason.
        $a = (new FakeValues(FakeValues::seedForCall('stripe', 'op', ['amount' => 2500])))->id('pi');
        $b = (new FakeValues(FakeValues::seedForCall('stripe', 'op', ['amount' => 2500])))->id('pi');
        $c = (new FakeValues(FakeValues::seedForCall('stripe', 'op', ['amount' => 9900])))->id('pi');

        expect($a)->toBe($b);
        // Different inputs must differ, or a fixture asserting an exact value
        // proves nothing beyond "the faker returned something".
        expect($c)->not->toBe($a);
    });

    it('does not depend on key ORDER', function () {
        expect(FakeValues::seedForCall('stripe', 'op', ['a' => 1, 'b' => 2]))
            ->toBe(FakeValues::seedForCall('stripe', 'op', ['b' => 2, 'a' => 1]));
    });

    it('never reads the clock', function () {
        $fake = new FakeValues(1);

        expect($fake->timestamp())->toBe('2026-01-01T00:00:00.000Z');
        expect($fake->timestamp(3600))->toBe('2026-01-01T01:00:00.000Z');
    });
});

describe('Stripe webhook verification', function () {
    // A throwaway string, generated for this test and never used anywhere.
    $secret = 'whsec-for-this-test-only';
    $body = '{"id":"evt_1","type":"charge.refunded"}';

    it('accepts a correctly signed delivery', function () use ($secret, $body) {
        $timestamp = '1767225600';
        $signature = hash_hmac('sha256', $timestamp.'.'.$body, $secret);

        $result = StripeTrigger::verifyDelivery(
            $body,
            ['stripe-signature' => "t={$timestamp},v1={$signature}"],
            $secret,
            (int) $timestamp,
        );

        expect($result['ok'])->toBeTrue();
    });

    it('rejects a delivery outside the replay window even when the signature is valid', function () use ($secret, $body) {
        // Without a tolerance a valid signature is valid forever, so anyone who
        // ever saw one delivery could replay it whenever they liked.
        $timestamp = '1767225600';
        $signature = hash_hmac('sha256', $timestamp.'.'.$body, $secret);

        $result = StripeTrigger::verifyDelivery(
            $body,
            ['stripe-signature' => "t={$timestamp},v1={$signature}"],
            $secret,
            (int) $timestamp + 400,
        );

        expect($result)->toBe(['ok' => false, 'reason' => 'delivery is outside the 300s replay window']);
    });

    it('rejects a tampered body', function () use ($secret, $body) {
        $timestamp = '1767225600';
        $signature = hash_hmac('sha256', $timestamp.'.'.$body, $secret);

        $result = StripeTrigger::verifyDelivery(
            '{"id":"evt_1","type":"charge.refunded","amount":999999}',
            ['stripe-signature' => "t={$timestamp},v1={$signature}"],
            $secret,
            (int) $timestamp,
        );

        expect($result)->toBe(['ok' => false, 'reason' => 'signature did not match']);
    });

    it('REFUSES when no secret is configured, rather than accepting', function () use ($body) {
        // An endpoint that verifies nothing because nobody set a secret is
        // strictly worse than one that is off: it looks protected.
        $result = StripeTrigger::verifyDelivery($body, ['stripe-signature' => 't=1,v1=deadbeef'], null);

        expect($result['ok'])->toBeFalse();
        expect($result['reason'])->toContain('no signing secret');
    });

    it('finds the signature header whatever case the proxy used', function () use ($secret, $body) {
        $timestamp = '1767225600';
        $signature = hash_hmac('sha256', $timestamp.'.'.$body, $secret);

        $result = StripeTrigger::verifyDelivery(
            $body,
            ['Stripe-Signature' => "t={$timestamp},v1={$signature}"],
            $secret,
            (int) $timestamp,
        );

        expect($result['ok'])->toBeTrue();
    });

    it('parses the packed signature header and ignores non-v1 schemes', function () {
        expect(Stripe::parseSignature('t=123,v1=abc,v0=ignored'))
            ->toBe(['signature' => 'abc', 'timestamp' => '123']);
    });

    it('signs {timestamp}.{body} with a 300 second window', function () {
        expect(Stripe::signedPayload('BODY', '42'))->toBe('42.BODY');
        expect(Stripe::TOLERANCE)->toBe(300);
    });
});

describe('error classification decides whether a durable run may retry', function () {
    it('marks a 429 retryable — checked BEFORE the 4xx sweep', function () {
        // A rate limit is a 4xx and is the one 4xx worth retrying. Ordering the
        // checks the other way would mark every throttle permanent and turn a
        // busy minute into a failed run.
        $error = HttpErrors::classify(429, 'stripe', 'op', 'slow down', 12);

        expect($error->retryable())->toBeTrue();
        expect($error->retryAfter)->toBe(12);
    });

    it('marks 5xx retryable and 4xx not', function () {
        expect(HttpErrors::classify(503, 'stripe', 'op', '')->retryable())->toBeTrue();
        expect(HttpErrors::classify(400, 'stripe', 'op', '')->retryable())->toBeFalse();
    });

    it('never retries an auth failure — hammering a bad credential locks accounts', function () {
        expect(HttpErrors::classify(401, 'stripe', 'op', '')->retryable())->toBeFalse();
        expect(HttpErrors::classify(403, 'stripe', 'op', '')->retryable())->toBeFalse();
    });

    it('names the mode mismatch on an auth failure, because that is the usual cause', function () {
        expect(HttpErrors::classify(401, 'stripe', 'op', '')->getMessage())
            ->toContain('live key in sandbox, or the reverse');
    });
});

/**
 * The idempotency key, and the one case where a connector must refuse to write.
 *
 * Asserted line for line against `tests/js/flow-nodes/connectors/core.test.ts`,
 * because a divergence here means one backend deduplicates a retried payment
 * and the other charges twice.
 */
describe('idempotency keys', function () {
    $ctxFor = function (?RunIdentity $identity, array $inputs = []): ExecutionContext {
        return new ExecutionContext(
            new FlowNode(id: 'pay', type: 'stripe_payment_intent'),
            $inputs,
            static fn ($event) => null,
            0,
            $identity,
        );
    };

    it('derives a key from the run identity the engine supplies', function () use ($ctxFor) {
        expect(Idempotency::keyFor($ctxFor(new RunIdentity('run_a')), 'pay'))->toBe('run_a:pay');
    });

    it('sends the SAME key on a retry of the same step', function () use ($ctxFor) {
        // The money case. A key that moves with the attempt creates a second
        // charge on the first timeout, which is the failure it exists to prevent.
        $first = Idempotency::keyFor($ctxFor(new RunIdentity('run_a', [], 1)), 'pay');
        $retry = Idempotency::keyFor($ctxFor(new RunIdentity('run_a', [], 4)), 'pay');

        expect($retry)->toBe($first);
    });

    it('sends a DIFFERENT key for a different execution of the same node', function () use ($ctxFor) {
        $keys = [
            Idempotency::keyFor($ctxFor(new RunIdentity('run_a')), 'pay'),
            Idempotency::keyFor($ctxFor(new RunIdentity('run_b')), 'pay'),
            Idempotency::keyFor($ctxFor((new RunIdentity('run_a'))->descend('billing')), 'pay'),
            Idempotency::keyFor($ctxFor(new RunIdentity('run_a')), 'pay', occurrence: 2),
        ];

        expect(array_unique($keys))->toHaveCount(4);
    });

    it('REFUSES a retry once the provider window has elapsed', function () use ($ctxFor) {
        // Past the window Stripe has forgotten the key, so resending it and
        // minting a fresh one BOTH charge twice. Refusing is the only safe answer.
        $stale = new RunIdentity('run_a', [], 2, '2026-08-18T00:00:00Z');

        Idempotency::keyFor($ctxFor($stale), 'pay', now: '2026-08-19T01:00:00Z');
    })->throws(ConnectorIdempotencyExpiredException::class);

    it('never refuses a FIRST attempt, however long the run was parked', function () use ($ctxFor) {
        // The human-gate case: an approval sits for eighteen days, then the
        // writing node runs for the first time. Nothing was sent to forget.
        $parked = new RunIdentity('run_a', [], 1, '2026-08-01T00:00:00Z');

        expect(Idempotency::keyFor($ctxFor($parked), 'pay', now: '2026-08-19T00:00:00Z'))->toBe('run_a:pay');
    });

    it('returns null when the host published no identity at all', function () use ($ctxFor) {
        // A real answer: send no header rather than invent a key.
        expect(Idempotency::keyFor($ctxFor(null), 'pay'))->toBeNull();
    });

    it('still honours a host-seeded __runKey, for a consumer on an older engine', function () use ($ctxFor) {
        expect(Idempotency::keyFor($ctxFor(null, ['__runKey' => 'run_seeded']), 'pay'))->toBe('run_seeded:pay');
    });

    it('shortens an over-long key deterministically rather than letting Stripe 400', function () use ($ctxFor) {
        $path = array_map(static fn (int $i) => "segment-{$i}", range(0, 39));
        $deep = new RunIdentity('run_a', $path);

        $key = Idempotency::keyFor($ctxFor($deep), 'pay');

        expect(strlen((string) $key))->toBeLessThanOrEqual(Idempotency::MAX_KEY_LENGTH)
            ->and($key)->toBe(Idempotency::keyFor($ctxFor($deep), 'pay'));
    });
});
