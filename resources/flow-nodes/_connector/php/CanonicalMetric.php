<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/CanonicalMetric.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * What a metric IS across providers, where an honest equivalent exists.
 *
 * A like and a favourite are the same act; a repost and a boost are the same
 * act; a quote often has no equivalent, and NULL says so — which is more useful
 * than a mapping somebody invented to make a table line up.
 */
enum CanonicalMetric: string
{
    case Like = 'like';

    case Share = 'share';

    case Reply = 'reply';

    case Quote = 'quote';

    case View = 'view';
}
