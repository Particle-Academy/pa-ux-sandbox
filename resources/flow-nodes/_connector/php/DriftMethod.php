<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/DriftMethod.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** How the check was done, so a report can be read without the code. */
enum DriftMethod: string
{
    case OpenApi = 'openapi';

    case Lexicon = 'lexicon';

    case RecordedShape = 'recorded-shape';

    case None = 'none';
}
