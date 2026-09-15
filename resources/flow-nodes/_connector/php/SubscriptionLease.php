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
 * The boundaries are DECIDED, not measured, and pinned in
 * `fixtures/subscription-lease/cases.json`, which the TypeScript twin reads too.
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

        $parsed = DateTimeImmutable::createFromFormat(DateTimeInterface::RFC3339_EXTENDED, $value)
            ?: DateTimeImmutable::createFromFormat(DateTimeInterface::RFC3339, $value)
            ?: (str_ends_with($value, 'Z') ? DateTimeImmutable::createFromFormat('Y-m-d\TH:i:s.u\Z', $value, new DateTimeZone('UTC')) : false)
            ?: (str_ends_with($value, 'Z') ? DateTimeImmutable::createFromFormat('Y-m-d\TH:i:s\Z', $value, new DateTimeZone('UTC')) : false);

        if ($parsed === false) {
            throw new ConnectorConfigException("{$field} is not a real instant: ".json_encode($value), $service, $operation);
        }

        return $parsed;
    }

    /** Microseconds since the epoch — integer arithmetic, so a fraction never rounds a boundary. */
    private static function micros(DateTimeInterface $at): int
    {
        return (int) $at->format('U') * 1_000_000 + (int) $at->format('u');
    }
}
