<?php


// GENERATED from particle-academy/fancy-connectors — php/src/SpecKind.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * The format a provider's machine-readable description is in.
 *
 * This matters because "machine-readable" is not one format. AT Protocol
 * publishes LEXICONS, not OpenAPI, and a checker that assumed OpenAPI would
 * report every AT Protocol connector as unspecified — a different and much worse
 * answer than "specified, in another format".
 */
enum SpecKind: string
{
    case OpenApi = 'openapi';

    case Lexicon = 'lexicon';

    /** The provider publishes nothing. Requires a reason — see {@see SpecSource}. */
    case None = 'none';
}
