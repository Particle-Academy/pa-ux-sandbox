<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/ModeResolver.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * Resolve the mode one connector call runs in.
 *
 * Pure, so a host can unit-test its own wiring without a network or a provider,
 * and so both runtimes can be held to the same table of cases. The rule, in one
 * line: **explicit beats the connection, the connection beats the environment.**
 */
final class ModeResolver
{
    public static function resolve(
        ?Mode $requested,
        ?Mode $connectionMode,
        SandboxKind $sandbox,
        bool $hasSandboxCredentials,
        bool $production,
    ): Mode {
        // 1. An explicit ask wins everywhere. This is the rule that makes the
        //    environment a default rather than a cage.
        if ($requested !== null) {
            if ($requested === Mode::Sandbox && $sandbox === SandboxKind::None) {
                throw new ConnectorModeException(
                    'This connector\'s provider has no sandbox estate, so "sandbox" cannot be honoured. '
                    .'Use "fake" to develop without credentials, or "live" to talk to the provider.'
                );
            }

            return $requested;
        }

        // 2. A mode pinned on the CONNECTION — one place per service, which is
        //    the whole reason connections exist as a separate thing.
        if ($connectionMode !== null) {
            return $connectionMode;
        }

        // 3. Otherwise the environment decides.
        if ($production) {
            return Mode::Live;
        }

        // Local: prefer the provider's own test estate when it exists AND is
        // wired. Falling through to `fake` when it is not is what makes a freshly
        // vendored connector runnable with no setup at all — the difference
        // between a marketplace you can try and one you can only read about.
        return $sandbox !== SandboxKind::None && $hasSandboxCredentials ? Mode::Sandbox : Mode::Fake;
    }
}
