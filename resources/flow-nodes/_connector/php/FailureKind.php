<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/FailureKind.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * Why a call failed, in the only terms that decide whether to try again.
 *
 * This is the primitive. Everything else about a failure — the exception class,
 * the HTTP status, the provider's own error code — is detail hung off one of
 * these four answers, because only one question actually matters at the moment a
 * retry is considered: **did the provider receive the request?**
 *
 * | kind                | did it arrive?                    | retry?                       |
 * |---------------------|-----------------------------------|------------------------------|
 * | `Unreachable`       | no                                | always safe                  |
 * | `RefusedExplicitly` | yes, and it says it did nothing   | safe                         |
 * | `Ambiguous`         | nobody can tell                   | only where repeating is safe |
 * | `Rejected`          | yes, and the answer was a real no | never                        |
 *
 * The third row is the whole design. A timeout looks exactly like a failure and
 * may have been a success, and retrying it on a connector with no idempotency
 * mechanism is a silent double write — arriving through the door marked
 * *reliability*.
 */
enum FailureKind: string
{
    /** Never reached the provider. A second attempt cannot duplicate anything. */
    case Unreachable = 'unreachable';

    /** The provider answered, and its answer was "not now". It did nothing. */
    case RefusedExplicitly = 'refused-explicitly';

    /** It may or may not have been acted on. Nobody can tell. */
    case Ambiguous = 'ambiguous';

    /** The provider answered and the answer was a real, permanent no. */
    case Rejected = 'rejected';
}
