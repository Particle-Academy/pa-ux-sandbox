<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/DriftFindingKind.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** What a drift check found. */
enum DriftFindingKind: string
{
    /** The path or method is gone. A write will start failing. */
    case MissingOperation = 'missing-operation';

    /** Something we send is no longer accepted. */
    case MissingRequestField = 'missing-request-field';

    /**
     * Something we read is gone.
     *
     * **Silent**: the code keeps running and produces nothing, which is the
     * dangerous one and the reason a drift check exists at all.
     */
    case MissingResponseField = 'missing-response-field';

    /**
     * The spec URL moved or stopped parsing.
     *
     * Not drift in the API, but drift in our ability to SEE it, and it must not
     * read as "clean".
     */
    case UnreadableSpec = 'unreadable-spec';

    /** Nobody has looked at this contract in a long time. */
    case StaleReview = 'stale-review';
}
