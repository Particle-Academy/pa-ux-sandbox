<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/CredentialScope.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * Whose credential this is.
 *
 * The distinction exists because getting it wrong means either asking for the
 * same app secret five times, or letting one account's token reach another's.
 */
enum CredentialScope: string
{
    /** One value for the whole installation — an OAuth app serves every account. */
    case Provider = 'provider';

    /** One value per connected account. */
    case Account = 'account';
}
