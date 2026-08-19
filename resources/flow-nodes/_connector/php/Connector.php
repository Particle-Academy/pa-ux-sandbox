<?php


// GENERATED from particle-academy/fancy-connectors — php/src/Connector.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * One capability of one provider — what CALLING it involves.
 *
 * The target a connector acts on is the host's own content shape. This package
 * has no opinion about it and takes it as `mixed`: a field named for one host's
 * content model has no business in a shared contract, and a generic would only
 * push the same coupling one level up.
 *
 * ## What this package does NOT own, and never will
 *
 * Everything on this list belongs to the HOST, because each is enforced in one
 * place and every connector inherits it from the dispatch path rather than
 * implementing it:
 *
 * - **approval** — whether this may go out at all;
 * - **liveness** — `call()` TAKES `dryRun` on its {@see CallContext}; a
 *   connector must never resolve its own;
 * - **the approved-bytes comparison** — the host re-renders and refuses on
 *   mismatch. This package makes that possible by keeping {@see Render} pure and
 *   versioned, and does not perform it;
 * - **consent** for anything reaching a list of people;
 * - **any journal** — decisions, dispatches, runs;
 * - **credential storage.** Credentials are ARGUMENTS.
 *
 * A packager that owned any of those would be unusable by a host that takes them
 * seriously — which is the only kind of host worth building for.
 *
 * ## The optional halves are separate interfaces on purpose
 *
 * TypeScript can mark a method optional; PHP cannot. Declaring `fetchMetrics()`
 * here and letting it return an empty array would destroy the one distinction
 * that matters — "nobody engaged" and "this cannot tell you" are different, and
 * only one of them is news. So rendering, metrics and feedback are
 * {@see RendersText}, {@see ReportsMetrics} and {@see ReportsFeedback}, and
 * `instanceof` answers the question `capabilityProblems()` asks.
 */
interface Connector
{
    public string $id { get; }

    public string $label { get; }

    /** Which {@see ProviderAdapter} stands this up. */
    public string $provider { get; }

    public Capabilities $capabilities { get; }

    /**
     * How this behaves when a call goes wrong, and how fast it may be used.
     * Cited, not asserted — see {@see DeliveryDeclaration}.
     */
    public DeliveryDeclaration $delivery { get; }

    /**
     * Declared metric shape. **Null, not an empty array**, where there are none.
     *
     * @var list<MetricDescriptor>|null
     */
    public ?array $metricShape { get; }

    /**
     * Rendering rules, where this connector renders text.
     *
     * Data rather than code for the common case. A provider whose rendering
     * genuinely needs code implements {@see RendersText} instead.
     */
    public ?RenderRules $renderRules { get; }

    /**
     * Everything the renderer cannot judge — media, alt text, a required field.
     *
     * **Never length**: see the note at the top of {@see Render}. A validator and
     * a renderer that both judge length will disagree, and then the validator
     * refuses content the renderer had already solved.
     *
     * @return list<Problem>
     */
    public function validate(mixed $target): array;

    /** Do the thing. `dryRun` and `credentials` arrive on the context. */
    public function call(mixed $target, CallContext $context): CallResult;
}
