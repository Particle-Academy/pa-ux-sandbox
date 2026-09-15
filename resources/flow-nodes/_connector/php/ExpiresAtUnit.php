<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/ExpiresAtUnit.php
// Do not edit here. Fix it in the package and re-run `node scripts/vendor.mjs --target <this directory>` there;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * How a provider spells its subscription expiry.
 *
 * Two, because two providers: Google Calendar's channel `expiration` is epoch
 * MILLISECONDS (as a JSON string, and a number is accepted too); Microsoft
 * Graph's `expirationDateTime` is ISO 8601 with a seven-digit fraction. A unit
 * no shipped provider spells is not here — a vocabulary with no provider is a
 * claim that outruns the code.
 */
enum ExpiresAtUnit: string
{
    case Rfc3339 = 'rfc3339';

    case EpochMs = 'epoch-ms';
}
