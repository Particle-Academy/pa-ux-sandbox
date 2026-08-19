<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/Metrics.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * Making a declared metric shape checkable against the code that produces it.
 *
 * ## The bug this exists to catch, which shipped for weeks
 *
 * Two connectors in the reference implementation declared
 * `capabilities.metrics: true` while their metric fetch returned nothing. A pull
 * therefore did not skip them — it asked, got nothing, and reported nothing,
 * which on a dashboard is indistinguishable from "we asked and nobody engaged".
 * A capability flag had quietly turned an unimplemented feature into a reported
 * zero, on the one surface whose entire job is not making claims it cannot stand
 * behind.
 *
 * A declared shape and the code that produces the numbers are the classic pair
 * that agrees on the day it is written and drifts silently after. So the mapping
 * is extracted as a PURE FUNCTION per connector, and these helpers feed it a
 * synthetic response and compare the keys it returns against the keys declared.
 * **No credentials, no network.**
 *
 * ## And the rule underneath all of it
 *
 * **Absent stays absent.** A count the provider did not send is omitted, never
 * reported as zero. A zero says "nothing happened"; an absence says "we don't
 * know". A measurement surface that confuses those is worthless, and the
 * confusion is one `?? 0` away.
 */
final class Metrics
{
    /**
     * Compare a declared shape against what a mapping actually returns.
     *
     * `$produced` is the output of the connector's pure response-to-metrics
     * function given a synthetic response with EVERY field populated. Anything
     * the mapping can emit therefore appears, and anything it cannot is caught
     * as a declaration nobody can honour.
     *
     * @param  list<MetricDescriptor>|null  $declared
     * @param  array<string,int|float>  $produced
     */
    public static function compareShape(string $connectorId, ?array $declared, array $produced): ?ShapeMismatch
    {
        $declaredKeys = array_map(static fn (MetricDescriptor $metric): string => $metric->key, $declared ?? []);
        $producedKeys = array_keys($produced);

        $undeclared = array_values(array_diff($producedKeys, $declaredKeys));
        $unproduced = array_values(array_diff($declaredKeys, $producedKeys));
        sort($undeclared);
        sort($unproduced);

        if ($undeclared === [] && $unproduced === []) {
            return null;
        }

        return new ShapeMismatch($connectorId, $undeclared, $unproduced);
    }

    /**
     * Every way a capability flag can outrun the code, as findings.
     *
     * Returns strings rather than throwing, so a host can report all of them at
     * once. A check that stops at the first problem trains people to fix one
     * thing and re-run, which is how a list of six becomes six rounds.
     *
     * @return list<string>
     */
    public static function capabilityProblems(Connector $connector): array
    {
        $problems = [];

        if ($connector->capabilities->metrics) {
            if ($connector->metricShape === null || $connector->metricShape === []) {
                $problems[] = $connector->id.' claims capabilities.metrics but declares no metricShape. A pull '
                    .'will therefore ask it, get nothing, and report nothing — which reads as "nobody engaged" '
                    .'rather than "not implemented".';
            }
            if (! $connector instanceof ReportsMetrics) {
                $problems[] = $connector->id.' claims capabilities.metrics but does not implement ReportsMetrics.';
            }
        }

        if (! $connector->capabilities->metrics && $connector->metricShape !== null) {
            $problems[] = $connector->id.' declares a metricShape but capabilities.metrics is false. One of the '
                .'two is wrong, and the shape is the more believable half.';
        }

        if ($connector->capabilities->feedback && ! $connector instanceof ReportsFeedback) {
            $problems[] = $connector->id.' claims capabilities.feedback but does not implement ReportsFeedback.';
        }

        if (! $connector->capabilities->feedback && $connector instanceof ReportsFeedback) {
            $problems[] = $connector->id.' implements ReportsFeedback but does not claim the capability, so '
                .'nothing will ever call it.';
        }

        foreach ($connector->metricShape ?? [] as $metric) {
            if (mb_strlen(trim($metric->means)) < 10) {
                $problems[] = $connector->id.'.'.$metric->key.' does not say what it means.';
            }
        }

        if ($connector->delivery->idempotent && mb_strlen(trim($connector->delivery->why)) < 10) {
            $problems[] = $connector->id.' declares idempotent: true with no reason. That is the one claim whose '
                .'failure is a public duplicate, so it has to name the mechanism rather than restate the flag.';
        }

        if ($connector->delivery->minIntervalMs > 0
            && $connector->delivery->citation === null
            && $connector->delivery->rateSource === RateSource::Documented
        ) {
            $problems[] = $connector->id.' calls its rate limit "documented" but cites nothing. A number nobody '
                .'can source gets quoted as a platform fact; label it self-imposed or cite it.';
        }

        return $problems;
    }

    /**
     * Drop keys whose value the provider did not actually send.
     *
     * The one function a connector's mapping should build on, so *absent stays
     * absent* is a property of the code rather than a habit. `0` survives; null,
     * a missing key and a non-number do not.
     *
     * @param  array<string,mixed>  $values
     * @return array<string,int|float>
     */
    public static function reported(array $values): array
    {
        $out = [];

        foreach ($values as $key => $value) {
            // is_numeric would accept the STRING "3", which is a different claim
            // — it means the provider sent something we have not parsed, and
            // coercing it here hides that.
            if ((is_int($value) || is_float($value)) && is_finite((float) $value)) {
                $out[$key] = $value;
            }
        }

        return $out;
    }

    /**
     * Every way a PROVIDER's declaration can outrun what anyone actually checked.
     *
     * The sibling of {@see self::capabilityProblems()}, one level up.
     * `metrics: true` with no shape turns an unimplemented feature into a
     * reported zero; the equivalent here turns *nobody looked* into a statement
     * about a test estate — and that field is the one where being wrong sends a
     * person to a live estate believing it is a test one.
     *
     * Strings rather than a throw, so a host reports all of them at once. A
     * check that stops at the first problem trains people to fix one thing and
     * re-run, which is how a list of six becomes six rounds.
     *
     * @return list<string>
     */
    public static function providerProblems(ProviderAdapter $provider): array
    {
        $problems = [];

        if ($provider->implemented && $provider->sandbox === SandboxKind::Unverified) {
            $problems[] = $provider->id.' says it is implemented while its sandbox shape is still "unverified". '
                .'Something a person can run today must not be ambiguous about which estate it reaches - verify '
                .'it, or set implemented: false.';
        }

        if ($provider->implemented && $provider->fields === []) {
            $problems[] = $provider->id.' says it is implemented but declares no credential fields.';
        }

        if ($provider->implemented && $provider->setup === []) {
            $problems[] = $provider->id.' says it is implemented and names no setup steps. The code is never the '
                .'expensive part; the setup is, and a provider whose setup is undocumented is one nobody can '
                .'stand up.';
        }

        foreach ($provider->fields as $field) {
            if (mb_strlen(trim($field->help)) < 10) {
                $problems[] = $provider->id.'.'.$field->key.' has no help text worth reading.';
            }
        }

        // Unconditional here, where the TypeScript twin asks only when a verify
        // exists. The interfaces genuinely differ: `verify()` is always declared
        // on this one and may return null at run time, so there is nothing
        // static to branch on — and a provider with no read to check against can
        // still say so in one sentence, which is more useful than silence.
        if ($provider->proves === null || trim($provider->proves) === '') {
            $problems[] = $provider->id.' does not say what its verify PROVES. A green tick that means more than '
                .'it should is worse than no tick - name the step it does not cover.';
        }

        if ($provider->sandbox === SandboxKind::RestrictedReach
            && ! str_contains(mb_strtolower($provider->summary), 'reach')) {
            $problems[] = $provider->id.' is declared restricted-reach and its summary never mentions reach. That '
                .'shape looks exactly like a successful post nobody can see, so the surface has to say so before '
                .'anyone runs it.';
        }

        return $problems;
    }
}
