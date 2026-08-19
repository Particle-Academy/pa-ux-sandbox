<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * Which copy of a provider a connector talks to.
 *
 * The PHP twin of `../js/mode.ts`. The two are held to the same table of cases
 * by the shared golden fixtures: a connector that resolved `auto` differently on
 * PHP than on Node would run against the live estate on one backend and the test
 * estate on the other, and nothing about the graph would show it.
 *
 * | mode      | talks to                   | needs credentials | needs network |
 * |-----------|----------------------------|-------------------|---------------|
 * | `live`    | the provider, for real     | yes               | yes           |
 * | `sandbox` | the provider's test estate | yes (test ones)   | yes           |
 * | `fake`    | the node's own faker       | no                | no            |
 *
 * **The environment is the DEFAULT, never the constraint.** A locally-hosted
 * project defaults to sandbox; an author who explicitly asks for live on their
 * laptop gets live. An environment that silently overrode a stated intention
 * would produce the worst outcome available here — a workflow that reports
 * success having charged nobody.
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

    /** Parse a config value, or null when it is absent / `auto`. */
    public static function requested(mixed $value): ?self
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value === '' || $value === 'auto' ? null : self::tryFrom($value);
    }
}
