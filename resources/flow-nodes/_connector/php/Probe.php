<?php


// GENERATED from particle-academy/fancy-connectors — php/src/Probe.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

use Throwable;

/**
 * Dry-verify — proving the transport with a credential that cannot work.
 *
 * ## The discipline, and why it beats a fake server
 *
 * A connector written from documentation can be wrong in three ways that look
 * identical until a real credential arrives:
 *
 * 1. the URL is wrong,
 * 2. the request shape is wrong,
 * 3. the error handling never runs.
 *
 * **All three are invisible to a test with a fake server**, because a fake
 * server agrees with whatever the code does. That is the single most important
 * thing this class encodes: a green unit suite against a mock proves the code is
 * consistent with itself and nothing more.
 *
 * So a probe calls the REAL API with a deliberately invalid credential and
 * requires an auth-shaped refusal. That proves the host resolved, the path
 * exists, the method was accepted, and a failure was recognised as a failure.
 *
 * ## What counts as a pass, precisely
 *
 * An auth-shaped refusal is `401`, `403`, or a `404` on a provider that answers
 * 404 for an unknown credential-in-the-path (a Discord webhook does exactly
 * this). The provider DECLARES which, because guessing here would let a genuine
 * "this endpoint moved" 404 read as success — the one outcome a probe exists to
 * catch.
 *
 * ## Offline is SKIPPED, never failed
 *
 * A check that goes red on a train gets ignored, and then it is worth nothing
 * when it goes red for real. Unreachable is reported as skipped with the reason,
 * and the assertions that need no network still run.
 *
 * ## And nothing is ever sent
 *
 * Every probe is a READ. A probe that wrote something would be a send, and sends
 * are the host's to gate.
 */
final class Probe
{
    /**
     * Run one probe.
     *
     * Never throws. A probe that threw would take the suite down with it, and
     * the suite's whole value is that it runs everywhere — including on a laptop
     * with no network.
     */
    public static function run(ProbeSpec $spec): ProbeResult
    {
        try {
            $response = ($spec->request)();
        } catch (Throwable $error) {
            $classified = Delivery::classifyError($error);

            // Unreachable is a fact about the machine, not about the connector.
            if ($classified->kind === FailureKind::Unreachable) {
                return new ProbeResult(
                    $spec->connector,
                    ProbeOutcome::Skip,
                    'offline — '.$classified->detail,
                );
            }

            return new ProbeResult(
                $spec->connector,
                ProbeOutcome::Fail,
                'the request failed before any status arrived — '.$classified->detail,
                null,
                $classified->kind,
            );
        }

        if (in_array($response->status, $spec->authStatuses, true)) {
            return new ProbeResult(
                $spec->connector,
                ProbeOutcome::Pass,
                "{$response->status} — the provider refused an invalid credential, which proves host, path, "
                ."method and error handling. {$spec->why}",
                $response->status,
            );
        }

        if ($response->status < 400) {
            // A success with a credential that cannot be valid means the request
            // is not doing what it appears to. Worse than a failure, because it
            // is green.
            return new ProbeResult(
                $spec->connector,
                ProbeOutcome::Fail,
                "{$response->status} — the provider ACCEPTED a deliberately invalid credential. Either the "
                .'credential is reaching nothing (wrong header, wrong field) or this endpoint does not '
                .'authenticate. Neither is safe to ship.',
                $response->status,
            );
        }

        $classified = Delivery::classifyStatus($response->status, $response->body);

        return new ProbeResult(
            $spec->connector,
            ProbeOutcome::Fail,
            "{$response->status} — expected one of ".implode(', ', $spec->authStatuses).". A {$response->status} "
            .'here usually means the endpoint moved or the path is wrong, which no amount of local mocking '
            .'would ever have said. '.mb_substr($response->body, 0, 200),
            $response->status,
            $classified->kind,
        );
    }

    /**
     * Run a set of probes and summarise.
     *
     * Sequential: probes hit real providers, and firing them in parallel is how
     * a verification run becomes the thing that trips a rate limit.
     *
     * @param  list<ProbeSpec>  $specs
     */
    public static function runProbes(array $specs): ProbeReport
    {
        $results = [];

        foreach ($specs as $spec) {
            $results[] = self::run($spec);
        }

        $count = static fn (ProbeOutcome $outcome): int => count(array_filter(
            $results,
            static fn (ProbeResult $result): bool => $result->outcome === $outcome,
        ));

        return new ProbeReport(
            $results,
            $count(ProbeOutcome::Pass),
            $count(ProbeOutcome::Fail),
            $count(ProbeOutcome::Skip),
        );
    }
}
