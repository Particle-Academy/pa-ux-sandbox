<?php


// GENERATED from particle-academy/fancy-connectors — php/src/ProbeOutcome.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * How one probe ended.
 *
 * `Skip` exists because offline must never be a failure. A check that goes red
 * on a train gets ignored, and is then worth nothing when it goes red for real.
 */
enum ProbeOutcome: string
{
    case Pass = 'pass';

    case Fail = 'fail';

    case Skip = 'skip';
}
