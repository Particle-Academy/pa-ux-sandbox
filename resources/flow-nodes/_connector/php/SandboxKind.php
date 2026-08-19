<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * How a provider exposes its test estate — the four shapes that actually exist.
 *
 * Data, not per-node code, because getting it wrong is the difference between
 * hitting a test ledger and a real one. Verified per provider in
 * `.ai/plans/fancy-flow-connector-nodes.md`; a node declares which of the four
 * it is and the shared core does the rest.
 */
enum SandboxKind: string
{
    /**
     * Same base URL; a test-scoped key selects the estate (Stripe's `sk_test_…`).
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
     * No test estate at all. `sandbox` is then not offered, and the node's
     * honest choices are `fake` and `live`.
     */
    case None = 'none';
}
