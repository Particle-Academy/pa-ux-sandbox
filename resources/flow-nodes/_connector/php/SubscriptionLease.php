<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/SubscriptionLease.php
// Do not edit here. Fix it in the package and re-run `node scripts/vendor.mjs --target <this directory>` there;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

use DateTimeImmutable;
use DateTimeInterface;
use DateTimeZone;

/**
 * A subscription that EXPIRES, and when the host must act on it.
 *
 * {@see DeliveryMechanism::Subscription} has said since 0.1.0 that such a
 * trigger is a webhook somebody has to renew, forever, and that if nobody does
 * the workflow stops firing with no error anywhere. This is the value for that
 * duty — ONE shape every expiring trigger declares, so a host runs one renewal
 * scheduler rather than learning a loop per connector, each with its own
 * boundary bugs.
 *
 * Three facts and two verbs:
 *
 * - `expiresAt` — the provider's expiry, an RFC 3339 instant. Google Calendar
 *   hands back `expiration` as epoch MILLISECONDS in a string and Microsoft
 *   Graph hands back `expirationDateTime` as ISO 8601; the CONNECTOR converts on
 *   the way in, and this class refuses anything that is not an instant rather
 *   than guessing units.
 * - `renewBeforeSeconds` — the connector's margin. Positive, because zero would
 *   make `Due` unreachable (the moment it applied, `Expired` would win) — a
 *   lease nobody ever renews, declared in a way nothing would report.
 * - `renewOperation` — the operation the host calls when the lease is due. For
 *   Graph that is a renew; for a Google Calendar channel, which cannot be
 *   renewed, it is the create again (the connector stops the old channel
 *   itself). The lease says WHEN; the connector says WHAT.
 *
 * - {@see state()} — where the lease IS. {@see action()} — what the host DOES.
 *
 * The boundaries are DECIDED, not measured, and pinned in fancy-conformance's
 * `shared/subscription-lease` suite, which drives the TypeScript twin too
 * (`php/tests/SubscriptionLeaseTest.php` and its node mirror).
 */
final class SubscriptionLease
{
    /** RFC 3339: date, `T`, time, optional fraction, `Z` or a numeric offset. */
    private const INSTANT = '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/';

    private function __construct(
        public readonly string $expiresAt,
        public readonly int $renewBeforeSeconds,
        public readonly string $renewOperation,
    ) {}

    /**
     * Validate a declaration and return the lease.
     *
     * @throws ConnectorConfigException naming the field that is wrong
     */
    public static function of(string $expiresAt, int $renewBeforeSeconds, string $renewOperation, string $service = '', string $operation = 'subscription'): self
    {
        self::instant($expiresAt, 'expiresAt', $service, $operation);

        if ($renewBeforeSeconds <= 0) {
            throw new ConnectorConfigException(
                "renewBeforeSeconds must be a positive whole number of seconds, got {$renewBeforeSeconds}. "
                .'Zero would make the lease due only at the instant it expires, which is a lease nobody renews.',
                $service,
                $operation,
            );
        }

        if (trim($renewOperation) === '') {
            throw new ConnectorConfigException(
                'renewOperation must name the operation the host calls when the lease is due; a due lease with nothing to call is one nobody renews.',
                $service,
                $operation,
            );
        }

        return new self($expiresAt, $renewBeforeSeconds, $renewOperation);
    }

    /** @param array{expiresAt: string, renewBeforeSeconds: int, renewOperation: string} $stored */
    public static function fromArray(array $stored): self
    {
        return self::of((string) $stored['expiresAt'], (int) $stored['renewBeforeSeconds'], (string) $stored['renewOperation']);
    }

    /**
     * Build the lease from the provider's create (or renew) response, by
     * declaration. The declared unit is never guessed around: digits under
     * `rfc3339`, or an instant under `epoch-ms`, are refused — a lease built
     * from a misread expiry is one that expires unannounced.
     *
     * The expiry is stored as an RFC 3339 instant in UTC at millisecond
     * precision; the lease's own refusals (margin, operation) still apply.
     *
     * @param  array<string,mixed>  $response  the decoded create/renew response
     *
     * @throws ConnectorConfigException naming the path, or the lease field, that is wrong
     */
    public static function fromResponse(LeaseDeclaration $declaration, array $response, string $service = '', string $operation = 'subscription'): self
    {
        $path = $declaration->expiresAtFrom;
        $value = self::readPath($response, $path);

        if ($value === null) {
            throw new ConnectorConfigException(
                "{$path} is not present in the response, so no lease can be built — a subscription with no known expiry is one nobody renews.",
                $service,
                $operation,
            );
        }

        if ($declaration->expiresAtUnit === ExpiresAtUnit::EpochMs) {
            $ms = is_int($value) ? $value : (is_string($value) && preg_match('/^\d+$/', $value) === 1 ? (int) $value : null);
            if ($ms === null) {
                throw new ConnectorConfigException(
                    "{$path} must be epoch milliseconds as digits under \"epoch-ms\", got ".json_encode($value).'.',
                    $service,
                    $operation,
                );
            }
            $at = DateTimeImmutable::createFromFormat('U.u', sprintf('%d.%03d000', intdiv($ms, 1000), $ms % 1000), new DateTimeZone('UTC'));
            if ($at === false) {
                throw new ConnectorConfigException("{$path} is not a representable instant: ".json_encode($value), $service, $operation);
            }
            $expiresAt = self::canonical($at);
        } else {
            if (! is_string($value) || preg_match(self::INSTANT, $value) !== 1) {
                throw new ConnectorConfigException(
                    "{$path} must be an RFC 3339 instant under \"rfc3339\", got ".json_encode($value).'.',
                    $service,
                    $operation,
                );
            }
            $expiresAt = self::canonical(self::instant($value, $path, $service, $operation));
        }

        return self::of($expiresAt, $declaration->renewBeforeSeconds, $declaration->renewOperation, $service, $operation);
    }

    /** @return array{expiresAt: string, renewBeforeSeconds: int, renewOperation: string} */
    public function toArray(): array
    {
        return [
            'expiresAt' => $this->expiresAt,
            'renewBeforeSeconds' => $this->renewBeforeSeconds,
            'renewOperation' => $this->renewOperation,
        ];
    }

    /** The instant the lease becomes due — `expiresAt - renewBeforeSeconds`, as `Y-m-d\TH:i:s.vZ` in UTC. */
    public function renewAt(): string
    {
        $expires = self::instant($this->expiresAt, 'expiresAt');
        $due = $expires->modify("-{$this->renewBeforeSeconds} seconds");

        return $due->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.v\Z');
    }

    /** Where the lease is at `$now`. Both boundaries are inclusive; `Expired` wins. */
    public function state(DateTimeInterface|string $now): LeaseState
    {
        $at = $now instanceof DateTimeInterface ? self::micros($now) : self::micros(self::instant($now, 'now'));
        $expires = self::micros(self::instant($this->expiresAt, 'expiresAt'));

        if ($at >= $expires) {
            return LeaseState::Expired;
        }
        if ($at >= $expires - $this->renewBeforeSeconds * 1_000_000) {
            return LeaseState::Due;
        }

        return LeaseState::Active;
    }

    /** What the host does about the lease at `$now`. */
    public function action(DateTimeInterface|string $now): LeaseAction
    {
        return match ($this->state($now)) {
            LeaseState::Active => LeaseAction::None,
            LeaseState::Due => LeaseAction::Renew,
            LeaseState::Expired => LeaseAction::Resync,
        };
    }

    private static function instant(string $value, string $field, string $service = '', string $operation = 'subscription'): DateTimeImmutable
    {
        if (preg_match(self::INSTANT, $value) !== 1) {
            throw new ConnectorConfigException(
                "{$field} must be an RFC 3339 instant such as \"2026-09-22T00:00:00Z\", got ".json_encode($value).'. '
                ."A provider's own shape — Google's epoch milliseconds, say — is converted by the connector, never guessed at here.",
                $service,
                $operation,
            );
        }

        // Millisecond precision, TRUNCATED, before parsing. Graph writes seven
        // fractional digits and PHP's parser stops at six; the lease keeps three
        // in both runtimes, so a boundary cannot fall between them, and an expiry
        // a fraction early is the safe direction.
        $normalised = preg_replace_callback(
            '/(?<=\d{2}:\d{2}:\d{2})(?:\.(\d+))?(?=Z|[+-]\d{2}:\d{2}$)/',
            fn (array $m): string => '.'.substr(str_pad($m[1] ?? '', 3, '0'), 0, 3),
            $value,
            1,
        ) ?? $value;

        $parsed = str_ends_with($normalised, 'Z')
            ? DateTimeImmutable::createFromFormat('Y-m-d\TH:i:s.v\Z', $normalised, new DateTimeZone('UTC'))
            : DateTimeImmutable::createFromFormat('Y-m-d\TH:i:s.vP', $normalised);

        if ($parsed === false) {
            throw new ConnectorConfigException("{$field} is not a real instant: ".json_encode($value), $service, $operation);
        }

        return $parsed;
    }

    /** An instant as this class stores it: UTC, millisecond precision. */
    private static function canonical(DateTimeInterface $at): string
    {
        return $at->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.v\Z');
    }

    /**
     * Walk a dotted path into a decoded response. Absent anywhere along it is null.
     *
     * @param  array<string,mixed>  $response
     */
    private static function readPath(array $response, string $path): mixed
    {
        $current = $response;
        foreach (explode('.', $path) as $segment) {
            if (! is_array($current) || ! array_key_exists($segment, $current)) {
                return null;
            }
            $current = $current[$segment];
        }

        return $current;
    }

    /** Microseconds since the epoch — integer arithmetic, so a fraction never rounds a boundary. */
    private static function micros(DateTimeInterface $at): int
    {
        return (int) $at->format('U') * 1_000_000 + (int) $at->format('u');
    }
}
