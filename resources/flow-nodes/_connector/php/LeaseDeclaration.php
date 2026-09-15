<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/LeaseDeclaration.php
// Do not edit here. Fix it in the package and re-run `node scripts/vendor.mjs --target <this directory>` there;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * What a subscription trigger DECLARES about its lease, so a host can build the
 * {@see SubscriptionLease} from the provider's create (or renew) response
 * without knowing the provider — {@see SubscriptionLease::fromResponse()}.
 */
final readonly class LeaseDeclaration
{
    /**
     * @param  string  $expiresAtFrom  dotted path to the expiry in the create/renew response,
     *                                 e.g. `expiration` or `channel.expiration`
     * @param  int  $renewBeforeSeconds  how early the host renews, in seconds. Positive.
     * @param  string  $renewOperation  the operation the host calls when the lease is due
     */
    public function __construct(
        public string $expiresAtFrom,
        public ExpiresAtUnit $expiresAtUnit,
        public int $renewBeforeSeconds,
        public string $renewOperation,
    ) {}

    /**
     * @param  array{expiresAtFrom: string, expiresAtUnit: string, renewBeforeSeconds: int, renewOperation: string}  $declared
     *
     * @throws ConnectorConfigException naming `expiresAtUnit` when the unit is not one this package spells
     */
    public static function fromArray(array $declared, string $service = '', string $operation = 'subscription'): self
    {
        $unit = ExpiresAtUnit::tryFrom((string) ($declared['expiresAtUnit'] ?? ''));

        if ($unit === null) {
            $units = implode(' | ', array_map(fn (ExpiresAtUnit $u) => $u->value, ExpiresAtUnit::cases()));

            throw new ConnectorConfigException(
                "expiresAtUnit must be one of {$units}, got ".json_encode($declared['expiresAtUnit'] ?? null).'.',
                $service,
                $operation,
            );
        }

        return new self(
            (string) ($declared['expiresAtFrom'] ?? ''),
            $unit,
            (int) ($declared['renewBeforeSeconds'] ?? 0),
            (string) ($declared['renewOperation'] ?? ''),
        );
    }

    /** @return array{expiresAtFrom: string, expiresAtUnit: string, renewBeforeSeconds: int, renewOperation: string} */
    public function toArray(): array
    {
        return [
            'expiresAtFrom' => $this->expiresAtFrom,
            'expiresAtUnit' => $this->expiresAtUnit->value,
            'renewBeforeSeconds' => $this->renewBeforeSeconds,
            'renewOperation' => $this->renewOperation,
        ];
    }
}
