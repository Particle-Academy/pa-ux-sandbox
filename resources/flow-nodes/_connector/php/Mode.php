<?php


// GENERATED from particle-academy/fancy-connectors — php/src/Mode.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * Which copy of a provider a connector talks to.
 *
 * | mode      | talks to                   | needs credentials | needs network |
 * |-----------|----------------------------|-------------------|---------------|
 * | `live`    | the provider, for real     | yes               | yes           |
 * | `sandbox` | the provider's test estate | yes (test ones)   | yes           |
 * | `fake`    | the connector's own faker  | no                | no            |
 *
 * ## The environment is the DEFAULT, never the constraint
 *
 * A locally-hosted project defaults to sandbox. It is not PINNED to sandbox: an
 * author who explicitly asks for `live` on their laptop gets `live`, because the
 * alternative — an environment that silently overrides a stated intention —
 * produces the worst outcome available here, which is a workflow that reports
 * success while having charged nobody. Equally, `sandbox` set explicitly stays
 * sandbox in production, which is how you stage a connector before cutting over.
 *
 * ## Why "fake" is a MODE and not a test double
 *
 * Every connector ships a faker, and it is reachable the same way in a test, in
 * a demo and on a laptop with no credentials. Making it a separate mechanism — a
 * mock injected only under test — would mean the code path a consumer develops
 * against is not the one that runs, and the fixtures would prove nothing about
 * the executor.
 */
enum Mode: string
{
    case Fake = 'fake';

    case Sandbox = 'sandbox';

    case Live = 'live';

    /** True when the mode reaches the provider over the network. */
    public function isRemote(): bool
    {
        return $this !== self::Fake;
    }

    /**
     * Parse a config value, or null when it is absent or `auto`.
     *
     * `auto` maps to null on purpose: "let the rules decide" and "nobody said"
     * are the same instruction, and giving them separate representations would
     * mean two code paths that must never diverge.
     */
    public static function requested(mixed $value): ?self
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value === '' || $value === 'auto' ? null : self::tryFrom($value);
    }
}
