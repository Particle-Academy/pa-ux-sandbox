<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/Chain.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

use Throwable;

/**
 * Posting a sequence as a CHAIN — the bug that is silent in every direction.
 *
 * ## What went wrong in the reference implementation
 *
 * A renderer split long copy into `(1/3)`, `(2/3)`, `(3/3)` and the connector
 * posted each segment TOP-LEVEL, on two providers. Numbered like a thread,
 * connected to nothing. Nothing threw; the send reported success; the numbering
 * made it look deliberate, so a reader assumes the thread exists and they missed
 * it.
 *
 * It was unreachable by any test, because the chaining lived inside a loop that
 * needed a live session. So the chain builder here TAKES THE POST FUNCTION AS AN
 * ARGUMENT — which is the entire reason this is a class rather than four lines
 * inside a connector.
 *
 * ## The rule it encodes, which is one line and easy to reverse
 *
 * > **`root` is fixed at the top of the chain and never moves. `parent` advances
 * > to whatever was just posted.**
 *
 * Reverse them and every message attaches to the first: a fan, not a thread —
 * and the provider's response looks identical either way, which is why this
 * needs a test rather than care.
 *
 * ## What it deliberately does NOT do
 *
 * No retry. Retry wraps ONE request (see {@see Delivery}); wrapping the chain
 * would re-post every earlier segment when a later one failed, turning a partial
 * send into a duplicated one. A partial chain is reported with what it did post,
 * so a person can see exactly where it stopped.
 */
final class Chain
{
    /**
     * Post `$segments` as a connected chain, optionally starting inside an
     * existing conversation.
     *
     * `$post` is given the text and the links for this position — null for a
     * top-level message — and returns the provider's reference to what it
     * created.
     *
     * **Stops at the first failure and reports what it posted.** Continuing
     * would produce a thread with a hole in it, and unwinding is not available:
     * nothing here can delete a public message, and pretending otherwise would
     * be worse than the hole.
     *
     * @param  list<string>  $segments
     * @param  callable(string, ChainLinks|null, int): array<string,string|int>  $post
     */
    public static function post(array $segments, ?ChainLinks $answering, callable $post): ChainOutcome
    {
        $posted = [];
        $root = $answering?->root;
        $parent = $answering?->parent;

        foreach (array_values($segments) as $index => $text) {
            try {
                $made = $post($text, $root !== null && $parent !== null ? new ChainLinks($root, $parent) : null, $index);
            } catch (Throwable $error) {
                return new ChainOutcome($posted, $index, $error);
            }

            $posted[] = $made;
            // The first thing WE post becomes the root of our own chain — unless
            // we are already inside somebody else's, in which case theirs stays
            // the root.
            $root ??= $made;
            $parent = $made;
        }

        return new ChainOutcome($posted);
    }
}
