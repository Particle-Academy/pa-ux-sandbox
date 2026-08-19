<?php


// GENERATED from particle-academy/fancy-connectors — php/src/ConnectorClient.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

use Throwable;

/**
 * The one call path every connector uses.
 *
 * A connector never chooses between "call the provider" and "call the faker" —
 * it describes the request it wants and hands it here. That is the point: the
 * code path a consumer develops against with no credentials is the same code
 * path that runs in production, so fixtures prove something about the connector
 * rather than about a mock.
 *
 * ```php
 * $charge = $client->call(
 *     service: STRIPE,
 *     operation: 'charge_create',
 *     credentials: $credentials,
 *     request: ['method' => 'POST', 'path' => '/v1/charges', 'form' => [...]],
 *     idempotencyKey: $key,
 *     idempotent: true,
 * );
 * ```
 *
 * ## What changed from the previous runtime, and why it is a fix
 *
 * The old loop caught a thrown transport, called it
 * `ConnectorTransientException` (retryable) and retried it with a budget of two
 * extra attempts. A thrown transport includes a TIMEOUT, which may be a request
 * the provider received and acted on — so on a connector with no idempotency key
 * that retry is a silent double write, and the old code made **three attempts**
 * where this makes **one**.
 *
 * Retrying is now a function of the classification AND the connector's declared
 * idempotency, routed through {@see Delivery::deliver()} so the decision lives in
 * exactly one place. `$idempotent` DEFAULTS TO FALSE, because a connector that
 * has not thought about it must not be assumed safe.
 */
final class ConnectorClient
{
    public function __construct(
        private readonly ?ConnectionHost $host = null,
        private readonly ?Transport $transport = null,
        private readonly ?Sleeper $sleeper = null,
    ) {}

    /**
     * @param  array<string,mixed>  $config  the caller's resolved config; reads `mode` and
     *                                       `connection`, and is passed to the faker so its
     *                                       output is deterministic
     * @param  array<string,mixed>  $request  {method, path, query?, headers?, json?, form?}
     * @param  array<string,string>|null  $credentials  passed IN. Nothing in this package
     *                                                  reads the environment — no `getenv`, no `$_ENV`, no `$_SERVER`. Supplying
     *                                                  these bypasses the connection registry entirely; see
     *                                                  {@see ConnectionHost::resolve()}.
     * @param  string|null  $idempotencyKey  derive it from the run and the step, NEVER a
     *                                       fresh uuid: the entire point is that a RETRY carries the same key. See
     *                                       {@see Idempotency}.
     * @param  bool  $idempotent  whether repeating this exact request is harmless. The only
     *                            thing that makes an ambiguous failure retryable, so it is opt-in and has to be
     *                            true because the PROVIDER makes it true — not because a retry would be
     *                            convenient.
     * @param  int|null  $attempts  total attempts including the first; the conservative
     *                              default when null
     */
    public function call(
        ServiceDescriptor $service,
        string $operation,
        array $config = [],
        array $request = [],
        mixed $input = null,
        ?string $idempotencyKey = null,
        bool $idempotent = false,
        ?int $attempts = null,
        ?array $credentials = null,
        ?Mode $mode = null,
        ?Transport $transport = null,
    ): ConnectorResult {
        $host = $this->host ?? new ConnectionHost;

        $connection = $host->resolve(
            service: $service->service,
            operation: $operation,
            config: $config,
            sandbox: $service->sandbox,
            requires: $service->requires,
            baseUrls: $service->baseUrls,
            credentials: $credentials,
            requested: $mode,
        );

        if ($connection->mode === Mode::Fake) {
            $fake = new FakeValues(FakeValues::seedForCall($service->service, $operation, $config));

            return new ConnectorResult(
                ($service->faker)($operation, $config, $fake, $input),
                Mode::Fake,
                $connection->id,
            );
        }

        $prepared = $this->prepare($service, $connection, $operation, $request, $idempotencyKey);
        $send = $transport ?? $this->transport ?? new CurlTransport;

        $outcome = Delivery::deliver(
            function () use ($send, $prepared, $service, $operation): mixed {
                try {
                    $response = $send->send($prepared);
                } catch (Throwable $cause) {
                    // classifyThrown decides unreachable vs ambiguous. It never
                    // returns a 5xx-shaped "transient", because nothing here
                    // reached the provider.
                    throw HttpErrors::classifyThrown($cause, $service->service, $operation);
                }

                if ($response->status < 400) {
                    return trim($response->body) === ''
                        ? null
                        : $this->decode($response->body, $service->service, $operation);
                }

                throw HttpErrors::classify(
                    $response->status,
                    $service->service,
                    $operation,
                    $response->body,
                    self::retryAfter($response->headers),
                );
            },
            new RetryPolicy(
                attempts: $attempts ?? (new RetryPolicy)->attempts,
                idempotent: $idempotent,
            ),
            $this->sleeper,
        );

        if (! $outcome->ok) {
            throw self::failureFrom($outcome, $service->service, $operation);
        }

        return new ConnectorResult($outcome->value, $connection->mode, $connection->id, $outcome->attempts);
    }

    /**
     * Turn an exhausted delivery into the exception a host sees.
     *
     * An ambiguous failure on a non-idempotent connector gets a message that
     * says *go and look*, because that is the action. "Request failed" would send
     * someone to re-run it, which is the one thing that must not happen.
     */
    private static function failureFrom(DeliveryOutcome $outcome, string $service, string $operation): ConnectorException
    {
        $last = $outcome->attempts === [] ? null : $outcome->attempts[count($outcome->attempts) - 1];
        $kind = $outcome->kind ?? $last?->kind ?? FailureKind::Ambiguous;
        $message = $outcome->gaveUp ?? "{$service}.{$operation} failed.";

        return match ($kind) {
            FailureKind::Unreachable => new ConnectorUnreachableException($message, $service, $operation),
            FailureKind::RefusedExplicitly => new ConnectorTransientException($message, $service, $operation),
            FailureKind::Rejected => new ConnectorRequestException($message, $service, $operation),
            FailureKind::Ambiguous => new ConnectorAmbiguousException($message, $service, $operation),
        };
    }

    /**
     * @param  array<string,mixed>  $request
     */
    private function prepare(
        ServiceDescriptor $service,
        ResolvedConnection $connection,
        string $operation,
        array $request,
        ?string $idempotencyKey,
    ): PreparedRequest {
        $base = $connection->baseUrl ?? $service->baseUrls[$connection->mode->value] ?? null;

        if ($base === null) {
            throw new ConnectorConfigException(
                $service->service.": no base URL for \"{$connection->mode->value}\" mode. "
                .'The service descriptor must declare one per mode it supports.',
                $service->service,
                $operation,
            );
        }

        $url = rtrim($base, '/').'/'.ltrim((string) ($request['path'] ?? ''), '/');
        $query = array_filter((array) ($request['query'] ?? []), static fn (mixed $v): bool => $v !== null);

        if ($query !== []) {
            $url .= (str_contains($url, '?') ? '&' : '?').http_build_query($query);
        }

        $prepared = new PreparedRequest(
            strtoupper((string) ($request['method'] ?? 'GET')),
            $url,
            ['Accept' => 'application/json'] + (array) ($request['headers'] ?? []),
        );

        if (isset($request['form'])) {
            $prepared->headers['Content-Type'] = 'application/x-www-form-urlencoded';
            // `http_build_query` produces the bracketed nesting several payment
            // APIs expect (`metadata[order_id]=7`), matching the JS encoder.
            $prepared->body = http_build_query((array) $request['form']);
        } elseif (array_key_exists('json', $request)) {
            $prepared->headers['Content-Type'] = 'application/json';
            $prepared->body = json_encode($request['json'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: '';
        }

        if ($idempotencyKey !== null && $service->idempotencyHeader !== null) {
            $prepared->headers[$service->idempotencyHeader] = $idempotencyKey;
        }

        ($service->authorize)($connection->credentials, $prepared, $connection->mode);

        return $prepared;
    }

    private function decode(string $body, string $service, string $operation): mixed
    {
        $decoded = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            // A body that is not JSON on a 2xx is a REJECTION, not something to
            // retry: the same request will produce the same unparseable body.
            throw new ConnectorRequestException(
                "{$service}.{$operation}: the provider returned a body that is not JSON.",
                $service,
                $operation,
            );
        }

        return $decoded;
    }

    /** @param array<string,string> $headers */
    private static function retryAfter(array $headers): ?int
    {
        $raw = $headers['retry-after'] ?? null;

        return is_numeric($raw) ? (int) $raw : null;
    }
}
