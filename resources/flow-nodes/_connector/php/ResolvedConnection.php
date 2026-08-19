<?php


// GENERATED from particle-academy/fancy-connectors — php/src/ResolvedConnection.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** What a caller needs once everything has been resolved. */
final readonly class ResolvedConnection
{
    /**
     * @param  array<string,string>  $credentials  empty in `fake` mode — there is nothing
     *                                             to authenticate against, and carrying a
     *                                             secret into the fake path would be a
     *                                             secret in a place nobody audits
     */
    public function __construct(
        public string $id,
        public string $service,
        public Mode $mode,
        public array $credentials = [],
        public ?string $baseUrl = null,
    ) {}
}
