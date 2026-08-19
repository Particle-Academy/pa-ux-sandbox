<?php


// GENERATED from particle-academy/fancy-connectors — php/src/ApiContract.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** Everything a connector declares about the API it was written against. */
final readonly class ApiContract
{
    /**
     * @param  list<ContractOperation>  $operations
     * @param  string  $reviewedOn  when a PERSON last read the provider's documentation for
     *                              this contract. Not when a check last ran — a check
     *                              cannot notice something the spec never said.
     * @param  string|null  $baseUrl  base URL the operations hang off, for a human reading
     *                                the report
     */
    public function __construct(
        public string $connector,
        public SpecSource $spec,
        public array $operations,
        public string $reviewedOn,
        public ?string $baseUrl = null,
    ) {}
}
