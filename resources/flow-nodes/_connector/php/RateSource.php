<?php


// GENERATED from particle-academy/fancy-connectors — php/src/RateSource.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * Whose number a rate limit is.
 *
 * A confident figure nobody can cite is worse than an honest one that is too
 * slow, because the honest one gets revised when evidence turns up and the
 * confident one gets quoted as a platform fact.
 */
enum RateSource: string
{
    /** The provider published it. Pair it with a Citation. */
    case Documented = 'documented';

    /** Our own guess, chosen to be safe rather than accurate. */
    case SelfImposed = 'self-imposed';
}
