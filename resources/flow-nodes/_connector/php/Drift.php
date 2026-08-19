<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/Drift.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * API drift — being told the provider changed, rather than discovering it.
 *
 * ## The failure this addresses
 *
 * A connector's worst failure is silent. The provider changes its API and
 * nothing says so until something breaks in production — and by then the person
 * who wrote the connector has moved on, the reason it worked is gone, and the
 * first symptom is usually a 400 that reads like bad input.
 *
 * ## What the system DOES on drift: it REPORTS. It never adapts.
 *
 * This is the load-bearing decision and it is deliberate. A connector that
 * reshapes itself around a changed API is worse than one that fails loudly, for
 * three reasons that compound:
 *
 * 1. **It cannot be reviewed.** The bytes that go out stop being a function of
 *    the source someone read. A host that guarantees "what was approved is what
 *    was sent" cannot make that guarantee about code that rewrote itself.
 * 2. **Its behaviour depends on WHEN it ran**, because it depends on what the
 *    spec said at that moment. Two runs of the same workflow on the same input
 *    can differ, and nothing in the run record explains why.
 * 3. **Adaptation is only ever a guess at intent.** A renamed field might be a
 *    rename or might be a different field with a similar name; a removed one
 *    might be gone or moved. Getting it wrong writes wrong data confidently.
 *
 * ## And it never changes RUNTIME behaviour either
 *
 * A drift check runs out of band — on a schedule, in CI, on demand. It does not
 * fail a call that is working. If the spec changed and the call still succeeds,
 * failing the run would be a self-inflicted outage caused by a document. The
 * only thing that changes runtime behaviour is the provider actually refusing,
 * which the error taxonomy already handles.
 *
 * So: **drift reports; the provider decides; a person acts.**
 *
 * ## Two detection strategies, because most providers publish nothing
 *
 * 1. **Specs**, where a provider publishes a machine-readable one at a stable
 *    URL. Checked against the connector's declared slice — see
 *    {@see ApiContract}.
 * 2. **Recorded shapes**, where it does not. A fixture of the response fields a
 *    connector reads, compared against a live response on a schedule. Field
 *    NAMES only.
 *
 * The second is the fallback and is designed anyway, because it is the majority
 * case: of the providers surveyed for this package, the ones publishing a
 * maintained spec are a minority, and publishing one is not the same as
 * maintaining it.
 *
 * ## The reader stays narrow and dependency-free ON PURPOSE
 *
 * This is not an OpenAPI parser and must not become one. The general problem —
 * diff two OpenAPI documents — is large, and we do not have it. We have a much
 * smaller one: *for the operations this connector actually calls, do the path,
 * the method, and the fields we send and read still exist?* That projection is
 * ours by definition, it is a few dozen lines, and it does not drag a
 * schema-validation library into every consumer's tree. A full diff would also
 * report thousands of changes to parts of the API nobody here calls, which is
 * the reliable way to make a drift report unread.
 */
final class Drift
{
    /** How long a contract may go unreviewed before that is itself a finding. */
    public const REVIEW_STALE_DAYS = 180;

    /**
     * Check a contract against an OpenAPI document ALREADY FETCHED by the caller.
     *
     * The fetch is the caller's, not this function's — so the check is a pure
     * function of two documents and can be tested against a fixture with no
     * network, and so a host chooses its own HTTP client, cache and proxy. A
     * checker that fetched would also be a checker that phones out on a
     * schedule, which is exactly the thing several hosts of this package refuse
     * to have.
     *
     * @param  mixed  $document  the decoded document, as `json_decode($raw, true)` returns it
     */
    public static function checkAgainstOpenApi(ApiContract $contract, mixed $document): DriftReport
    {
        $checkedAt = self::now();

        if (! is_array($document) || ! isset($document['paths']) || ! is_array($document['paths'])) {
            return new DriftReport(
                $contract->connector,
                $checkedAt,
                DriftOutcome::Unchecked,
                [
                    new DriftFinding(
                        DriftFindingKind::UnreadableSpec,
                        'the document has no `paths`, so it is not an OpenAPI description we can read. Reported '
                        .'as UNCHECKED rather than clean — a checker that cannot see is not a checker that saw '
                        .'nothing wrong.',
                    ),
                ],
                DriftMethod::OpenApi,
            );
        }

        $findings = [];

        foreach ($contract->operations as $operation) {
            $path = $document['paths'][$operation->path] ?? null;

            if (! is_array($path)) {
                $findings[] = new DriftFinding(
                    DriftFindingKind::MissingOperation,
                    "{$operation->method->value} {$operation->path} is not in the spec at all. The path moved or "
                    .'was removed.',
                    $operation->operation,
                );

                continue;
            }

            $method = $path[strtolower($operation->method->value)] ?? null;

            if (! is_array($method)) {
                $findings[] = new DriftFinding(
                    DriftFindingKind::MissingOperation,
                    "{$operation->path} exists but no longer accepts {$operation->method->value}.",
                    $operation->operation,
                );

                continue;
            }

            if ($operation->sends !== []) {
                $accepted = self::propertiesOf($document, self::requestSchemaOf($document, $method));

                // An empty schema means "we could not read it", not "it accepts
                // nothing". Reporting every field as missing there would bury
                // the real findings under a wall of noise on the first run.
                if ($accepted !== []) {
                    foreach ($operation->sends as $field) {
                        if (! in_array($field, $accepted, true)) {
                            $findings[] = new DriftFinding(
                                DriftFindingKind::MissingRequestField,
                                "sends `{$field}`, which the spec no longer lists on {$operation->method->value} "
                                .$operation->path.'.',
                                $operation->operation,
                            );
                        }
                    }
                }
            }

            if ($operation->reads !== []) {
                $returned = self::propertiesOf($document, self::responseSchemaOf($document, $method));

                if ($returned !== []) {
                    foreach ($operation->reads as $field) {
                        if (! in_array($field, $returned, true)) {
                            $findings[] = new DriftFinding(
                                DriftFindingKind::MissingResponseField,
                                "reads `{$field}`, which the spec no longer returns from "
                                ."{$operation->method->value} {$operation->path}. This is the silent kind: the "
                                .'code keeps running and produces nothing.',
                                $operation->operation,
                            );
                        }
                    }
                }
            }
        }

        $findings = [...$findings, ...self::staleReviewFindings($contract, $checkedAt)];

        return new DriftReport(
            $contract->connector,
            $checkedAt,
            self::outcomeFor($findings),
            $findings,
            DriftMethod::OpenApi,
        );
    }

    /**
     * The field names present in a response, flattened to dotted paths.
     *
     * Arrays collapse to their first element's shape: a response with three
     * items has ONE shape, and recording `items.0.id`, `items.1.id`,
     * `items.2.id` would make the fixture depend on how much data the account
     * happened to have that day.
     *
     * @return list<string>
     */
    public static function shapeOf(mixed $value, string $prefix = '', int $depth = 0): array
    {
        if ($depth > 6 || ! is_array($value)) {
            return $prefix === '' ? [] : [$prefix];
        }

        if (array_is_list($value)) {
            return $value === []
                ? [$prefix.'[]']
                : self::shapeOf($value[0], $prefix.'[]', $depth + 1);
        }

        $names = [];

        foreach ($value as $key => $nested) {
            $path = $prefix === '' ? (string) $key : $prefix.'.'.$key;
            $names = [...$names, ...self::shapeOf($nested, $path, $depth + 1)];
        }

        sort($names);

        return $names;
    }

    /**
     * Compare a live response's shape against what the contract says it reads.
     *
     * **Only fields the connector READS are findings.** A provider adding fields
     * is normal and healthy; reporting it would bury the one line that matters
     * under every additive release, and a drift report nobody reads is worse
     * than none because it is evidence somebody is watching.
     */
    public static function checkAgainstRecordedShape(
        ApiContract $contract,
        string $operation,
        mixed $liveResponse,
    ): DriftReport {
        $checkedAt = self::now();
        $declared = null;

        foreach ($contract->operations as $entry) {
            if ($entry->operation === $operation) {
                $declared = $entry;

                break;
            }
        }

        $present = self::shapeOf($liveResponse);
        $findings = [];

        foreach ($declared?->reads ?? [] as $field) {
            // A dotted path matches its own name or any array-bearing variant of
            // it, so a connector reading `data.id` still matches `data[].id`.
            $found = false;

            foreach ($present as $name) {
                if ($name === $field || str_replace('[]', '', $name) === $field) {
                    $found = true;

                    break;
                }
            }

            if (! $found) {
                $shown = array_slice($present, 0, 20);
                $findings[] = new DriftFinding(
                    DriftFindingKind::MissingResponseField,
                    "reads `{$field}`, which the live response no longer carries. Present instead: "
                    .implode(', ', $shown).(count($present) > 20 ? ', …' : ''),
                    $operation,
                );
            }
        }

        $findings = [...$findings, ...self::staleReviewFindings($contract, $checkedAt)];

        return new DriftReport(
            $contract->connector,
            $checkedAt,
            self::outcomeFor($findings),
            $findings,
            DriftMethod::RecordedShape,
        );
    }

    /**
     * A contract whose provider publishes nothing, checked as far as it can be.
     *
     * Reported as `Unchecked` with the reason, never `Clean`. Those are
     * different claims and the difference is the entire value of a report.
     */
    public static function unchecked(ApiContract $contract): DriftReport
    {
        $checkedAt = self::now();

        return new DriftReport(
            $contract->connector,
            $checkedAt,
            DriftOutcome::Unchecked,
            [
                new DriftFinding(
                    DriftFindingKind::UnreadableSpec,
                    $contract->spec->kind === SpecKind::None
                        ? (string) $contract->spec->note
                        : 'no spec document was supplied to the checker, so nothing was compared.',
                ),
                ...self::staleReviewFindings($contract, $checkedAt),
            ],
            DriftMethod::None,
        );
    }

    /**
     * Resolve a local `$ref`.
     *
     * **Remote refs are NOT followed.** A remote `$ref` would mean fetching
     * arbitrary URLs out of a document we do not control, on a schedule, with
     * nobody watching — which is a request-forgery surface, not a feature.
     */
    private static function resolveRef(array $document, mixed $node, int $depth = 0): mixed
    {
        if ($depth > 8 || ! is_array($node)) {
            return $node;
        }

        $ref = $node['$ref'] ?? null;

        if (! is_string($ref) || ! str_starts_with($ref, '#/')) {
            return $node;
        }

        $current = $document;

        foreach (explode('/', substr($ref, 2)) as $segment) {
            if (! is_array($current)) {
                return $node;
            }

            $key = str_replace(['~1', '~0'], ['/', '~'], $segment);
            $current = $current[$key] ?? null;
        }

        return self::resolveRef($document, $current, $depth + 1);
    }

    /**
     * Property names on a schema, following local refs and one level of
     * composition.
     *
     * @return list<string>
     */
    private static function propertiesOf(array $document, mixed $schema, int $depth = 0): array
    {
        $resolved = self::resolveRef($document, $schema, $depth);

        if (! is_array($resolved) || $depth > 6) {
            return [];
        }

        $names = [];
        $properties = self::resolveRef($document, $resolved['properties'] ?? null, $depth + 1);

        if (is_array($properties)) {
            foreach (array_keys($properties) as $key) {
                $names[] = (string) $key;
            }
        }

        // `data` / `items` wrappers are near-universal and a connector reads
        // THROUGH them, so an envelope must not read as "the field is gone".
        foreach (['items', 'additionalProperties'] as $key) {
            if (isset($resolved[$key])) {
                $names = [...$names, ...self::propertiesOf($document, $resolved[$key], $depth + 1)];
            }
        }

        foreach (['allOf', 'oneOf', 'anyOf'] as $key) {
            $list = $resolved[$key] ?? null;

            if (is_array($list)) {
                foreach ($list as $entry) {
                    $names = [...$names, ...self::propertiesOf($document, $entry, $depth + 1)];
                }
            }
        }

        return array_values(array_unique($names));
    }

    private static function requestSchemaOf(array $document, array $operation): mixed
    {
        $body = self::resolveRef($document, $operation['requestBody'] ?? null);

        if (! is_array($body) || ! is_array($body['content'] ?? null)) {
            return null;
        }

        foreach ($body['content'] as $media) {
            if (is_array($media) && isset($media['schema'])) {
                return $media['schema'];
            }
        }

        return null;
    }

    private static function responseSchemaOf(array $document, array $operation): mixed
    {
        $responses = self::resolveRef($document, $operation['responses'] ?? null);

        if (! is_array($responses)) {
            return null;
        }

        foreach ($responses as $status => $_) {
            if (preg_match('/^2\d\d$/', (string) $status) !== 1 && (string) $status !== 'default') {
                continue;
            }

            $response = self::resolveRef($document, $responses[$status]);

            if (! is_array($response) || ! is_array($response['content'] ?? null)) {
                continue;
            }

            foreach ($response['content'] as $media) {
                if (is_array($media) && isset($media['schema'])) {
                    return $media['schema'];
                }
            }
        }

        return null;
    }

    /**
     * A review that has gone stale is a finding, but NOT drift.
     *
     * It reports an absence of looking, which is the state a silent break grows
     * in — so it never on its own makes an outcome `drifted`.
     *
     * @return list<DriftFinding>
     */
    private static function staleReviewFindings(ApiContract $contract, string $checkedAt): array
    {
        $reviewed = strtotime($contract->reviewedOn);

        if ($reviewed === false) {
            return [
                new DriftFinding(
                    DriftFindingKind::StaleReview,
                    "reviewedOn \"{$contract->reviewedOn}\" is not a date.",
                ),
            ];
        }

        $days = (int) floor(((int) strtotime($checkedAt) - $reviewed) / 86400);

        if ($days <= self::REVIEW_STALE_DAYS) {
            return [];
        }

        return [
            new DriftFinding(
                DriftFindingKind::StaleReview,
                "nobody has read this provider's documentation in {$days} days. Not drift — an absence of "
                .'looking, which is the state a silent break grows in.',
            ),
        ];
    }

    /** @param list<DriftFinding> $findings */
    private static function outcomeFor(array $findings): DriftOutcome
    {
        foreach ($findings as $finding) {
            if ($finding->kind !== DriftFindingKind::StaleReview) {
                return DriftOutcome::Drifted;
            }
        }

        return DriftOutcome::Clean;
    }

    private static function now(): string
    {
        return gmdate('Y-m-d\TH:i:s\Z');
    }
}
