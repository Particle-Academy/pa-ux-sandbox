<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/ConnectionSpec.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * One configured connection to one service — credentials plus an environment
 * choice, configured once and referenced by everything that uses it.
 *
 * ## Why this is not per-call config
 *
 * The obvious design is an API-key field on each caller. It is also wrong, for
 * three reasons that only surface later:
 *
 * 1. **Rotation.** A key in twelve places is twelve edits and one you will miss.
 * 2. **The sandbox/live switch has to live somewhere singular.** Per-caller, a
 *    workflow can be half in the test estate and half in the real one, and
 *    nothing anywhere shows it.
 * 3. **Credentials would be in the graph.** A workflow document is plain JSON
 *    that gets exported, committed, handed to agents and pasted into issues.
 *    Nothing secret may ever be in it.
 *
 * So a caller stores a connection ID — an opaque, non-secret name — and the host
 * resolves it to credentials at run time. The caller cannot reach for a
 * credential; the host has to hand one over.
 *
 * Note what is NOT in this file: no key, no token, no placeholder that looks like
 * one, and no read of the environment. Credentials are configuration, and
 * configuration comes from the consumer.
 */
final class ConnectionSpec
{
    /**
     * @param  string  $service  must match the caller's service name
     * @param  array<string,string>  $live  credentials for the live estate
     * @param  array<string,string>  $sandbox  credentials for the test estate
     * @param  Mode|null  $mode  pin this connection to a mode; usually null, so the
     *                           environment can supply the default
     * @param  array<string,string>  $baseUrl  per-mode base URL override, keyed by mode
     *                                         value — only needed for a `separate-account`
     *                                         provider whose tenant has its own host
     */
    public function __construct(
        public readonly string $service,
        public readonly array $live = [],
        public readonly array $sandbox = [],
        public readonly ?Mode $mode = null,
        public readonly ?string $label = null,
        public readonly array $baseUrl = [],
    ) {}

    /** @return array<string,string> */
    public function credentialsFor(Mode $mode): array
    {
        return match ($mode) {
            Mode::Live => $this->live,
            Mode::Sandbox => $this->sandbox,
            Mode::Fake => [],
        };
    }

    /**
     * Whether this connection carries every key a remote call needs.
     *
     * An EMPTY `$keys` answers false rather than true, deliberately: a service
     * that requires nothing gives no evidence that a sandbox estate is wired,
     * and reading "requires nothing" as "sandbox is ready" would silently
     * default a local run to sandbox against credentials nobody set.
     *
     * @param  list<string>  $keys
     */
    public function hasAll(Mode $mode, array $keys): bool
    {
        if ($keys === []) {
            return false;
        }

        $credentials = $this->credentialsFor($mode);

        foreach ($keys as $key) {
            if (($credentials[$key] ?? '') === '') {
                return false;
            }
        }

        return true;
    }
}
