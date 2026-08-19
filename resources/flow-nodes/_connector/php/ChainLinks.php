<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/ChainLinks.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * Where one message of a chain hangs.
 *
 * A reference is an opaque map, because the shape is the provider's: AT Protocol
 * needs a uri AND a cid, Mastodon needs one status id, Telegram needs a message
 * id and a chat. A type naming one provider's model would be wrong for the next
 * one, so a chain carries whatever the poster returned and never reads inside
 * it.
 */
final readonly class ChainLinks
{
    /**
     * @param  array<string,string|int>  $root  the top of the conversation. Fixed for the whole chain.
     * @param  array<string,string|int>  $parent  the message immediately above this one. Advances every step.
     */
    public function __construct(
        public array $root,
        public array $parent,
    ) {}
}
