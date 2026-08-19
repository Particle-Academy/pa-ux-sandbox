<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * The host's connections, bound once for the whole app.
 *
 * Constructor-injected rather than a module singleton, matching how the git
 * nodes take their `GitHost` — one app may serve several installations with
 * different credentials, so a global would be wrong here for the same reason it
 * is wrong there.
 *
 * ```php
 * $this->app->singleton(ConnectionHost::class, fn () => new ConnectionHost(
 *     production: app()->isProduction(),
 *     connections: [
 *         'stripe' => new ConnectionSpec(
 *             service: 'stripe',
 *             live:    ['secretKey' => config('services.stripe.secret')],
 *             sandbox: ['secretKey' => config('services.stripe.test_secret')],
 *         ),
 *     ],
 * ));
 * ```
 *
 * Note what is NOT in this file: no key, no token, no placeholder that looks
 * like one. Credentials are configuration, and configuration comes from the
 * consumer's environment.
 */
final class ConnectionHost
{
    /** @param array<string,ConnectionSpec> $connections */
    public function __construct(
        public readonly bool $production = false,
        public readonly array $connections = [],
    ) {}

    /** Connection ids configured for a service — feeds the picker. */
    public function idsFor(string $service): array
    {
        $ids = [];

        foreach ($this->connections as $id => $spec) {
            if ($spec->service === $service) {
                $ids[] = ['id' => $id, 'label' => $spec->label ?? $id];
            }
        }

        return $ids;
    }

    /**
     * Resolve the connection and mode for one call.
     *
     * ## `fake` needs no host at all
     *
     * A freshly vendored connector runs before anything is configured, and that
     * is deliberate: it is the difference between a marketplace someone can try
     * and one they can only read about. So an unconfigured id resolves to `fake`
     * — UNLESS the author explicitly asked for a remote mode, in which case the
     * ask is honoured by failing loudly rather than quietly doing something else.
     *
     * @param  array<string,mixed>  $config  the node's config
     * @param  list<string>  $requires  credential keys a remote call needs
     * @param  array<string,string>  $baseUrls  per-mode base URL from the service descriptor
     */
    public function resolve(
        string $service,
        string $operation,
        array $config,
        SandboxKind $sandbox,
        array $requires = [],
        array $baseUrls = [],
    ): ResolvedConnection {
        $requested = Mode::requested($config['mode'] ?? null);

        // Checked FIRST, before anything about the host, because it is a static
        // fact about the SERVICE. Asking for a sandbox that does not exist should
        // say so whether or not a connection happens to be configured —
        // otherwise the same mistake produces two different errors depending on
        // unrelated state, and the more useful one is the one you never see.
        if ($requested === Mode::Sandbox && $sandbox === SandboxKind::None) {
            throw new ConnectorModeException(
                "{$service} has no sandbox estate, so \"sandbox\" cannot be honoured. "
                .'Use "fake" to develop without credentials, or "live" to talk to the provider.',
                $service,
                $operation,
            );
        }

        $id = trim((string) ($config['connection'] ?? '')) ?: $service;
        $spec = $this->connections[$id] ?? null;

        if ($spec !== null && $spec->service !== $service) {
            throw new ConnectorConfigException(
                "connection \"{$id}\" is configured for the \"{$spec->service}\" service, but this node needs \"{$service}\".",
                $service,
                $operation,
            );
        }

        if ($spec === null) {
            if ($requested !== null && $requested !== Mode::Fake) {
                throw new ConnectorConfigException(
                    "no \"{$id}\" connection is registered, so {$service}.{$operation} cannot run in \"{$requested->value}\" mode. "
                    ."Bind a ConnectionHost carrying a '{$id}' ConnectionSpec — the node has no credentials of its own "
                    .'and must not invent any. Set the node\'s mode to "fake" to develop without one.',
                    $service,
                    $operation,
                );
            }

            return new ResolvedConnection($id, $service, Mode::Fake);
        }

        $mode = ModeResolver::resolve(
            $requested,
            $spec->mode,
            $sandbox,
            $spec->hasAll(Mode::Sandbox, $requires),
            $this->production,
        );

        if ($mode === Mode::Fake) {
            return new ResolvedConnection($id, $service, $mode);
        }

        $credentials = $spec->credentialsFor($mode);
        $missing = array_values(array_filter($requires, fn (string $key) => ($credentials[$key] ?? '') === ''));

        if ($missing !== []) {
            // Never silently degrade to the faker here. A run that "succeeded"
            // because it quietly stopped talking to the provider is the worst
            // failure this whole design exists to prevent — it is green, it is
            // wrong, and nothing reports it.
            throw new ConnectorConfigException(
                "connection \"{$id}\" has no ".implode(', ', $missing)." for {$mode->value} mode. "
                ."Set it on the ConnectionSpec's {$mode->value} credentials, or run this node in \"fake\" mode.",
                $service,
                $operation,
            );
        }

        return new ResolvedConnection(
            $id,
            $service,
            $mode,
            $credentials,
            $spec->baseUrl[$mode->value] ?? $baseUrls[$mode->value] ?? null,
        );
    }
}
