<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/SandboxKind.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * How a provider exposes its test estate — the shapes that actually exist.
 *
 * Data, not per-connector code, because getting it wrong is the difference
 * between hitting a test ledger and hitting a real one. A connector declares
 * which one it is and the core does the rest.
 *
 * Enum cases are runtime data as well as a type, which is what a host needs at
 * a JSON boundary: `SandboxKind::tryFrom($json)` fails loudly on a value that
 * no longer exists, where a TypeScript union crossing the same boundary would
 * silently compile against a name nobody serves any more.
 */
enum SandboxKind: string
{
    /**
     * Same base URL; a test-scoped key selects the estate (Stripe's `sk_test_…`).
     *
     * The trap worth naming: a LIVE key sent to the same URL works, so the only
     * thing separating the two ledgers is the credential itself.
     */
    case Credential = 'credential';

    /** A different host entirely (PayPal's `api-m.sandbox.paypal.com`). */
    case BaseUrl = 'base-url';

    /**
     * A distinct tenant you must create, often with its own login host
     * (Salesforce sandbox orgs authenticate against `test.salesforce.com`).
     */
    case SeparateAccount = 'separate-account';

    /**
     * No separate estate at all; what the provider offers instead is an
     * **account-level restriction on who can see the result**. A Meta app in
     * Development Mode; an unaudited TikTok app that can only post `SELF_ONLY`.
     * Same credentials, same endpoints, same estate — only the audience
     * changes, and nothing in a request selects it.
     *
     * **This is the dangerous one**, and it is why it is not folded into
     * {@see self::None}. It is the shape most likely to be mistaken for a
     * sandbox, because it looks exactly like a successful post that nobody can
     * see: ok, a real id, no audience. `None` says "there is nothing"; this says
     * "there is something, it is not selectable from here, and success does not
     * mean reach".
     */
    case RestrictedReach = 'restricted-reach';

    /**
     * No test estate at all. `sandbox` is then not offered, and the connector's
     * honest choices are `fake` and `live`.
     */
    case None = 'none';

    /**
     * **Nobody has checked yet.** A real state, and the type has to carry it.
     *
     * This is the field where being wrong sends someone to a live estate
     * believing it is a test one, so "researched but not verified" must not be
     * forced to pick one of the other five. It belongs on a provider declared
     * `implemented: false`; on one declared implemented it is a finding, and
     * {@see Metrics::providerProblems()} reports it.
     */
    case Unverified = 'unverified';

    /**
     * Whether a caller can actually SELECT this with `mode: sandbox`.
     *
     * The three that answer false are not smaller versions of the same thing.
     * `None` means there is no estate; `RestrictedReach` means there is a safer
     * way to run but it is an account-level setting a request cannot choose, so
     * selecting it here would be a lie; `Unverified` means nobody looked, and
     * refusing is the safe direction because the cost of guessing wrong is a
     * workflow pointed at a live estate.
     */
    public function isSelectable(): bool
    {
        return match ($this) {
            self::Credential, self::BaseUrl, self::SeparateAccount => true,
            self::RestrictedReach, self::None, self::Unverified => false,
        };
    }

    /**
     * Why `mode: sandbox` cannot be honoured, in the words the reader needs.
     *
     * Three reasons, three messages. Collapsing them into "no sandbox
     * available" would hide the one that matters.
     */
    public function refusal(string $service): string
    {
        return match ($this) {
            self::RestrictedReach => $service
                .' has no separate test estate. What it has instead is an ACCOUNT-LEVEL reach restriction - an '
                .'unreviewed app that posts only to its own developers, or only privately. Same credentials, same '
                .'endpoints, same estate: only the audience changes, and nothing in a request selects it. That '
                .'makes it the sandbox shape most likely to be mistaken for a real one, because a restricted call '
                .'looks exactly like a successful one - ok, a real id, and no audience. Use "fake" to develop '
                ."without touching the provider, or \"live\" and confirm reach on the provider's own surface, "
                .'which is the only place it is visible.',
            self::Unverified => 'Nobody has verified what test estate '.$service
                .' offers, so "sandbox" cannot be honoured - the resolver would be guessing, and the cost of '
                .'guessing wrong here is a workflow pointed at a live estate while somebody believes it is a test '
                .'one. Find out and declare it, or use "fake".',
            default => $service.' has no sandbox estate, so "sandbox" cannot be honoured. '
                .'Use "fake" to develop without credentials, or "live" to talk to the provider.',
        };
    }
}
