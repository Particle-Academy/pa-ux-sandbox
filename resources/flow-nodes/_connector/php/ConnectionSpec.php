<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * One configured connection to one service — credentials plus an environment
 * choice, configured once and referenced by every node that uses it.
 *
 * ## Why this is not per-node config
 *
 * The obvious design is an API-key field on each node. It is also wrong, for
 * three reasons that only surface later:
 *
 * 1. **Rotation.** A key on twelve nodes is twelve edits and one you will miss.
 * 2. **The sandbox/live switch has to live somewhere singular.** Per-node, a
 *    graph can be half in the test estate and half in the real one, and nothing
 *    on the canvas shows it.
 * 3. **Credentials would be in the graph.** A `WorkflowSchema` is plain JSON
 *    that gets exported, committed, handed to agents and pasted into issues.
 *    Nothing secret may ever be in it.
 *
 * So a node's config stores a connection ID — an opaque, non-secret name — and
 * the host resolves it to credentials at run time. Same arrangement fancy-flow
 * already uses for LLM clients and `fancy-git` for providers: the node cannot
 * reach for a credential, the host has to hand one over.
 */
final class ConnectionSpec
{
    /**
     * @param  string  $service  must match the node's `connector.service`
     * @param  array<string,string>  $live  credentials for the live estate
     * @param  array<string,string>  $sandbox  credentials for the test estate
     * @param  Mode|null  $mode  pin this connection to a mode; usually null, so the
     *                           environment can supply the default
     * @param  array<string,string>  $baseUrl  per-mode base URL override, keyed by mode
     *                                         value — only needed for a
     *                                         `separate-account` provider whose tenant
     *                                         has its own host
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
