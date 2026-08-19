<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/CallContext.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * Everything a `Connector::call()` is TOLD, rather than allowed to decide.
 *
 * Both fields are the point of the type:
 *
 * - **`dryRun` is decided by the HOST.** A connector that resolved its own
 *   liveness would end the host's guarantee, and there is deliberately no API
 *   here for it to do so. A host may require two independent yeses, or ten; that
 *   is its business and this package cannot help it get that wrong.
 * - **`credentials` are passed IN.** Nothing in this package reads the
 *   environment — no `getenv`, no `$_ENV`, no `$_SERVER`. A host stores values
 *   wherever it stores values and hands them over per call. A package that
 *   reached for the environment itself would bypass that discipline entirely.
 *
 * Named `CallContext` rather than `CallOptions` because {@see ConnectorClient}
 * already owns the latter idea, and two same-named things in one namespace is a
 * bug waiting for an autocomplete.
 */
final readonly class CallContext
{
    /**
     * @param  array<string,string>  $credentials
     */
    public function __construct(
        public bool $dryRun,
        public array $credentials,
        public ?Mode $mode = null,
    ) {}
}
