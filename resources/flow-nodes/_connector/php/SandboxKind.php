<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/SandboxKind.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * How a provider exposes its test estate — the four shapes that actually exist.
 *
 * Data, not per-connector code, because getting it wrong is the difference
 * between hitting a test ledger and hitting a real one. A connector declares
 * which of the four it is and the core does the rest.
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
     * No test estate at all. `sandbox` is then not offered, and the connector's
     * honest choices are `fake` and `live`.
     */
    case None = 'none';
}
