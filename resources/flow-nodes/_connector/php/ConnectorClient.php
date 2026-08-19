<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * The one call path every connector node uses.
 *
 * A node's executor never chooses between "call the provider" and "call the
 * faker" — it describes the request it wants and hands it here. That is the
 * point: the code path a consumer develops against with no credentials is the
 * same one that runs in production, so the golden fixtures prove something about
 * the executor rather than about a mock.
 *
 * The twin of `callConnector` in `../js/client.ts`, including the retry ladder,
 * because a durable run that retried on PHP and gave up on Node would not be a
 * twin of anything.
 */
final class ConnectorClient
{
    public function __construct(
        private readonly ConnectionHost $host,
        private readonly ?Transport $transport = null,
    ) {}

    /**
     * @param  array<string,mixed>  $config  the node's resolved config
     * @param  array<string,mixed>  $request  {method, path, query?, headers?, json?, form?}
     * @param  string|null  $idempotencyKey  derive it from the run and the node, NEVER a
     *                                       fresh uuid: the entire point is that a RETRY
     *                                       carries the same key
     */
    public function call(
        ServiceDescriptor $service,
        string $operation,
        array $config,
        array $request,
        mixed $input = null,
        ?string $idempotencyKey = null,
        int $retries = 2,
    ): ConnectorResult {
        $connection = $this->host->resolve(
            $service->service,
            $operation,
            $config,
            $service->sandbox,
            $service->requires,
            $service->baseUrls,
        );

        if ($connection->mode === Mode::Fake) {
            $fake = new FakeValues(FakeValues::seedForCall($service->service, $operation, $config));

            return new ConnectorResult(
                ($service->faker)($operation, $config, $fake, $input),
                Mode::Fake,
                $connection->id,
            );
        }

        return new ConnectorResult(
            $this->remote($service, $connection, $operation, $request, $idempotencyKey, $retries),
            $connection->mode,
            $connection->id,
        );
    }

    /**
     * @param  array<string,mixed>  $request
     */
    private function remote(
        ServiceDescriptor $service,
        ResolvedConnection $connection,
        string $operation,
        array $request,
        ?string $idempotencyKey,
        int $retries,
    ): mixed {
        $prepared = $this->prepare($service, $connection, $operation, $request, $idempotencyKey);
        $transport = $this->transport ?? new CurlTransport;
        $attempt = 0;

        for (; ;) {
            try {
                $response = $transport->send($prepared);
            } catch (ConnectorTransientException $error) {
                if ($attempt++ >= $retries) {
                    throw $error;
                }
                $this->pause(self::backoffMs($attempt));

                continue;
            }

            if ($response->status < 400) {
                return trim($response->body) === '' ? null : $this->decode($response->body, $service->service, $operation);
            }

            $error = HttpErrors::classify(
                $response->status,
                $service->service,
                $operation,
                $response->body,
                is_numeric($response->headers['retry-after'] ?? null) ? (int) $response->headers['retry-after'] : null,
            );

            if (! $error->retryable() || $attempt++ >= $retries) {
                throw $error;
            }

            // Honour the provider's own instruction when it gave one. Guessing
            // shorter than they asked is how a throttle becomes a ban.
            $wait = $error instanceof ConnectorRateLimitedException && $error->retryAfter !== null
                ? $error->retryAfter * 1000
                : self::backoffMs($attempt);

            $this->pause($wait);
        }
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
            throw new ConnectorException(
                "{$service}.{$operation}: the provider returned a body that is not JSON.",
                $service,
                $operation,
            );
        }

        return $decoded;
    }

    /** Exponential with a ceiling. Attempt 1 → 250ms, 2 → 500ms, 3 → 1s, capped at 8s. */
    private static function backoffMs(int $attempt): int
    {
        return (int) min(8000, 250 * 2 ** ($attempt - 1));
    }

    private function pause(int $milliseconds): void
    {
        usleep($milliseconds * 1000);
    }
}
