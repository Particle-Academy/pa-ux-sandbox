<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/LeaseState.php
// Do not edit here. Fix it in the package and re-run `node scripts/vendor.mjs --target <this directory>` there;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * Where a {@see SubscriptionLease} IS at a given instant.
 *
 * Both boundaries are inclusive, and `Expired` wins over `Due` at the same
 * instant: a lease that has just expired cannot be renewed.
 */
enum LeaseState: string
{
    case Active = 'active';
    case Due = 'due';
    case Expired = 'expired';
}
