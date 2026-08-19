<?php


// GENERATED from particle-academy/fancy-connectors — php/src/ConnectionHost.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * The host's connections, bound once for the whole app.
 *
 * Constructor-injected rather than a static singleton: one app may serve several
 * installations with different credentials, and a global would make that
 * impossible in the way that is hardest to notice — the second installation
 * would silently use the first one's key.
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
 * Note what is NOT in this file: no key, no token, no placeholder that looks like
 * one, and no `getenv`. Credentials are configuration, and configuration comes
 * from the consumer's own code.
 */
final class ConnectionHost
{
    /** @param array<string,ConnectionSpec> $connections */
    public function __construct(
        public readonly bool $production = false,
        public readonly array $connections = [],
    ) {}

    /**
     * Connection ids configured for a service — feeds a picker.
     *
     * @return list<array{id:string,label:string}>
     */
    public function idsFor(string $service): array
    {
        $ids = [];

        foreach ($this->connections as $id => $spec) {
            if ($spec->service === $service) {
                $ids[] = ['id' => (string) $id, 'label' => $spec->label ?? (string) $id];
            }
        }

        return $ids;
    }

    /**
     * Resolve the connection and mode for one call.
     *
     * ## Explicit credentials bypass the registry entirely
     *
     * `$credentials` is the PRIMARY path for a host that already owns credential
     * storage and has no wish to hand a package a second copy: it passes them
     * per call, this resolver consults no registry, and there is nothing to
     * initialise. The registry below remains for hosts that prefer to configure
     * once.
     *
     * Three consequences, and each is a decision rather than an accident:
     *
     * - an explicit `fake` still WINS, because asking for the faker is a
     *   statement and credentials sitting in the same call do not override it.
     *   Nothing secret is carried into the fake path;
     * - `auto` resolves to `live`, because supplying credentials IS the
     *   statement that a real call is intended, and consulting an environment
     *   this resolver was told nothing about would be inventing an answer;
     * - an INCOMPLETE credential set is a loud failure, never a fallback to the
     *   registry. `[]` is not `null`: it means "the caller supplied credentials
     *   and there are none", which fails the `requires` check rather than
     *   silently using somebody else's.
     *
     * ## `fake` needs no host at all
     *
     * A freshly vendored connector runs before anything is configured, and that
     * is deliberate: it is the difference between a marketplace someone can try
     * and one they can only read about. So an unconfigured id resolves to `fake`
     * — UNLESS the author explicitly asked for a remote mode, in which case the
     * ask is honoured by failing loudly rather than quietly doing something
     * else.
     *
     * @param  array<string,mixed>  $config  the caller's config; reads `mode` and `connection`
     * @param  list<string>  $requires  credential keys a remote call needs
     * @param  array<string,string>  $baseUrls  per-mode base URL from the service descriptor
     * @param  array<string,string>|null  $credentials  handed straight in, bypassing the registry
     * @param  Mode|null  $requested  overrides `$config['mode']` where a caller has it typed
     */
    public function resolve(
        string $service,
        string $operation,
        array $config = [],
        SandboxKind $sandbox = SandboxKind::None,
        array $requires = [],
        array $baseUrls = [],
        ?array $credentials = null,
        ?Mode $requested = null,
    ): ResolvedConnection {
        $requested ??= Mode::requested($config['mode'] ?? null);

        // Checked FIRST, before anything about the host or the credentials,
        // because it is a static fact about the SERVICE. Asking for a sandbox
        // that does not exist should say so whether or not a connection happens
        // to be configured — otherwise the same mistake produces two different
        // errors depending on unrelated state, and the more useful one is the
        // one you never see.
        if ($requested === Mode::Sandbox && $sandbox === SandboxKind::None) {
            throw new ConnectorModeException(
                "{$service} has no sandbox estate, so \"sandbox\" cannot be honoured. "
                .'Use "fake" to develop without credentials, or "live" to talk to the provider.',
                $service,
                $operation,
            );
        }

        $id = trim((string) ($config['connection'] ?? '')) ?: $service;

        if ($credentials !== null) {
            return $this->fromExplicitCredentials(
                $service,
                $operation,
                $id,
                $credentials,
                $requested,
                $requires,
                $baseUrls,
            );
        }

        $spec = $this->connections[$id] ?? null;

        if ($spec !== null && $spec->service !== $service) {
            throw new ConnectorConfigException(
                "connection \"{$id}\" is configured for the \"{$spec->service}\" service, but this call needs "
                ."\"{$service}\".",
                $service,
                $operation,
            );
        }

        if ($spec === null) {
            if ($requested !== null && $requested !== Mode::Fake) {
                throw new ConnectorConfigException(
                    "no \"{$id}\" connection is registered, so {$service}.{$operation} cannot run in "
                    ."\"{$requested->value}\" mode. Bind a ConnectionHost carrying a '{$id}' ConnectionSpec, or "
                    .'pass credentials to the call — this package has no credentials of its own and must not '
                    .'invent any. Use "fake" mode to develop without one.',
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

        $resolved = $spec->credentialsFor($mode);
        $missing = self::missing($resolved, $requires);

        if ($missing !== []) {
            // Never silently degrade to the faker here. A run that "succeeded"
            // because it quietly stopped talking to the provider is the worst
            // failure this whole design exists to prevent — it is green, it is
            // wrong, and nothing reports it.
            throw new ConnectorConfigException(
                "connection \"{$id}\" has no ".implode(', ', $missing)." for {$mode->value} mode. "
                ."Set it on the ConnectionSpec's {$mode->value} credentials, or run in \"fake\" mode.",
                $service,
                $operation,
            );
        }

        return new ResolvedConnection(
            $id,
            $service,
            $mode,
            $resolved,
            $spec->baseUrl[$mode->value] ?? $baseUrls[$mode->value] ?? null,
        );
    }

    /**
     * @param  array<string,string>  $credentials
     * @param  list<string>  $requires
     * @param  array<string,string>  $baseUrls
     */
    private function fromExplicitCredentials(
        string $service,
        string $operation,
        string $id,
        array $credentials,
        ?Mode $requested,
        array $requires,
        array $baseUrls,
    ): ResolvedConnection {
        if ($requested === Mode::Fake) {
            return new ResolvedConnection($id, $service, Mode::Fake);
        }

        $mode = $requested ?? Mode::Live;
        $missing = self::missing($credentials, $requires);

        if ($missing !== []) {
            throw new ConnectorConfigException(
                "{$service}.{$operation} was given credentials with no ".implode(', ', $missing).'. '
                .'Nothing is inferred from an incomplete credential set — a partial one is a configuration '
                .'mistake, and quietly falling back to another source is how the wrong account gets written to.',
                $service,
                $operation,
            );
        }

        return new ResolvedConnection($id, $service, $mode, $credentials, $baseUrls[$mode->value] ?? null);
    }

    /**
     * @param  array<string,string>  $credentials
     * @param  list<string>  $requires
     * @return list<string>
     */
    private static function missing(array $credentials, array $requires): array
    {
        return array_values(array_filter(
            $requires,
            static fn (string $key): bool => ($credentials[$key] ?? '') === '',
        ));
    }
}
