<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/ProviderAdapter.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * How an operator stands a provider up.
 *
 * ## Why this is separate from {@see Connector}
 *
 * They answer different questions and change on different clocks. A
 * `ProviderAdapter` answers *how does an operator stand this up, and does it
 * work?* — credential shapes, setup steps with the trap in each one named,
 * scopes, a read-only verify. It changes when the provider changes its
 * onboarding, which is rarely and disruptively. A `Connector` answers *what does
 * calling this actually involve?* and changes when the API changes, which is
 * often and quietly.
 *
 * Folding them together produces an object that has to be edited for both, and a
 * diff that cannot tell you which happened.
 *
 * Every provider worth listing is declared, **including the ones that cannot
 * work yet**: a provider missing from a catalogue reads as unsupported, while a
 * provider whose {@see implemented()} is false tells you exactly what it would
 * take.
 */
interface ProviderAdapter
{
    public string $id { get; }

    public string $label { get; }

    /** True when this can actually be used today. A real state, not a placeholder. */
    public bool $implemented { get; }

    /** One line on what it is for, shown before anyone opens the setup. */
    public string $summary { get; }

    /** @var list<CredentialField> */
    public array $fields { get; }

    /** @var list<SetupStep> */
    public array $setup { get; }

    /**
     * Exactly what to ask for, and no more.
     *
     * @var list<string>
     */
    public array $scopes { get; }

    /**
     * How long credentials last, where the provider publishes a figure.
     *
     * Null means the provider states no lifetime — which a surface should report
     * as "no published expiry" rather than inventing one, and still note that
     * anything can be revoked. "No known expiry" is not "cannot stop working".
     */
    public ?int $credentialLifetimeDays { get; }

    /** How the provider exposes a test estate, in the four shapes that exist. */
    public SandboxKind $sandbox { get; }

    /**
     * A read-only call proving the credential works AND reaches the right
     * account.
     *
     * Deliberately a READ. A verify that wrote something would be a send, and
     * sends are gated. Return null where the provider offers nothing to check
     * against — an honest gap, rather than a tick that means nothing.
     *
     * @param  array<string,string>  $credentials
     */
    public function verify(array $credentials): ?VerifyResult;
}
