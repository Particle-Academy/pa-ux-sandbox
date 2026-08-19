<?php


// GENERATED from particle-academy/fancy-connectors — php/src/RecordedShape.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * The field NAMES a connector saw in a real response, per operation.
 *
 * Names ONLY. A recorded response body from a real account is a data leak
 * wearing a test fixture's clothes, and the thing being checked is the shape.
 */
final readonly class RecordedShape
{
    /** @param array<string,list<string>> $operations */
    public function __construct(
        public string $connector,
        public string $recordedOn,
        public array $operations,
    ) {}
}
