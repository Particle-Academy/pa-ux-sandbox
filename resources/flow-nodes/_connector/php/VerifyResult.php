<?php


// GENERATED from particle-academy/fancy-connectors — php/src/VerifyResult.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * The result of a read-only credential check.
 *
 * **`proves` is not decoration.** Telegram's `getMe` validates the token and
 * says nothing about whether the bot was added to the target chat — which is the
 * step everyone actually gets stuck on. A green tick that means more than it
 * should is worse than no tick, so a verify states its own scope.
 */
final readonly class VerifyResult
{
    /**
     * @param  string  $detail  what was learned — ideally the account's real name, so the
     *                          id can be eyeballed against the one that was configured
     * @param  string|null  $proves  exactly what this proves, and what it does not
     */
    public function __construct(
        public bool $ok,
        public string $detail,
        public ?string $proves = null,
    ) {}
}
