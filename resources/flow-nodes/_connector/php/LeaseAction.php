<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/LeaseAction.php
// Do not edit here. Fix it in the package and re-run `node scripts/vendor.mjs --target <this directory>` there;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * What a host DOES about a {@see SubscriptionLease} at a given instant.
 *
 * `Resync` is the one to read twice: a missed lease is never a quiet
 * re-create, because notifications during the gap are gone. The host re-lists
 * (sync token or full) AND re-subscribes.
 */
enum LeaseAction: string
{
    case None = 'none';
    case Renew = 'renew';
    case Resync = 'resync';
}
