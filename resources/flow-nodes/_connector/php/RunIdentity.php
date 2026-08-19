<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/RunIdentity.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

use DateTimeInterface;

/**
 * A run, a position inside it, and how many times that position has been tried.
 *
 * ## Declared STRUCTURALLY, and that is the whole point
 *
 * This package must be usable by a host that has never heard of a workflow
 * engine, so it does not import one. `FancyFlow\Runtime\RunIdentity` satisfies
 * this shape exactly — `runKey`, `attempt`, `firstAttemptAt`, `stepKey()`,
 * `isReplaySafe()`, same signatures — and a host with its own notion of "the
 * same logical attempt" implements five members and gets the same guarantees.
 *
 * **PHP interfaces are nominal, not structural**, so a class that matches this
 * shape without declaring `implements RunIdentity` is not an instance of it. That
 * is a language fact rather than a design choice, and it is bridged by
 * {@see ForeignRunIdentity::adapt()} — which takes any object carrying the five
 * members and wraps it, so `$ctx->run` from a flow engine works with no import
 * and no dependency in either direction. Every entry point in
 * {@see Idempotency} runs its argument through that adapter.
 *
 * ## What actually identifies a step
 *
 * Not `(run, step)`. A step legitimately runs many times in one run — once per
 * loop iteration, once per nested invocation — so the key carries the PATH that
 * led to it. And the part that is easy to get backwards: **`attempt` is NOT part
 * of the key.** It is carried for logging and for {@see isReplaySafe()}, and
 * putting it in the key would restore the exact bug the key exists to prevent.
 */
interface RunIdentity
{
    /** Stable for the whole run: same across retries, resumes, workers and hosts. */
    public string $runKey { get; }

    /** 1-based attempt of THIS logical step. Never part of the key. */
    public int $attempt { get; }

    /** ISO-8601 instant of attempt 1 of this step. */
    public string $firstAttemptAt { get; }

    /** The identity of one execution of one step, stable across its retries. */
    public function stepKey(string $stepId, ?int $occurrence = null): string;

    /**
     * May this attempt reuse the key and still be deduplicated?
     *
     * True on attempt 1 whatever the elapsed time — nothing was sent on an
     * earlier attempt, so there is nothing for the provider to have forgotten.
     * That is what lets a run park on a human gate for a week and then write.
     */
    public function isReplaySafe(?int $windowSeconds, DateTimeInterface|string|null $now = null): bool;
}
