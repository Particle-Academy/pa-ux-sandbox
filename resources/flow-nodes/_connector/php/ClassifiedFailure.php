<?php


// GENERATED from particle-academy/fancy-connectors — php/src/ClassifiedFailure.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * A throwable that already knows what kind of failure it is.
 *
 * {@see Delivery::deliver()} trusts this and does not re-classify. That
 * indirection is what lets each connector decide what counts as a failure FOR
 * IT — a Telegram `200 OK` carrying `{"ok": false}` is a real refusal and only
 * the connector knows that — while the decision about RETRYING stays in one
 * place for all of them.
 *
 * Implement it on anything you throw from a transport or a connector. Anything
 * that does not implement it is classified by {@see Delivery::classifyError()},
 * which falls to `Ambiguous`.
 */
interface ClassifiedFailure
{
    public function classified(): Classified;
}
