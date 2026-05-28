<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/**
 * Computes coin yield for various earn signals and credits the user's
 * wallet. Centralized so listeners + admin grants share the same math
 * and audit trail shape.
 */
class CoinMinter
{
    /**
     * Mint coins from an XP award. Yield = floor(xp * rate). Zero or
     * non-User recipients are silently skipped.
     */
    public function fromXp(Model $recipient, string $metricSlug, int $xpAmount, ?string $reason = null, ?Model $ref = null): int
    {
        if (! $recipient instanceof User) {
            return 0;
        }

        $rate = config("coins.earn.per_xp.{$metricSlug}", config('coins.earn.default_per_xp', 0));
        $coins = (int) floor($xpAmount * $rate);

        if ($coins <= 0) {
            return 0;
        }

        $recipient->getWallet()->credit(
            amount: $coins,
            reason: $reason ?? "XP yield on {$metricSlug}",
            ref: $ref,
            metadata: ['source' => 'xp-yield', 'metric' => $metricSlug, 'xp' => $xpAmount],
        );

        return $coins;
    }

    /**
     * Mint coins on achievement unlock. Per-achievement bonus or default.
     */
    public function fromAchievement(Model $recipient, string $achievementSlug, ?Model $ref = null): int
    {
        if (! $recipient instanceof User) {
            return 0;
        }

        $coins = (int) config(
            "coins.earn.achievement.{$achievementSlug}",
            config('coins.earn.default_achievement', 0),
        );

        if ($coins <= 0) {
            return 0;
        }

        $recipient->getWallet()->credit(
            amount: $coins,
            reason: "Achievement bonus: {$achievementSlug}",
            ref: $ref,
            metadata: ['source' => 'achievement', 'achievement' => $achievementSlug],
        );

        return $coins;
    }

    /**
     * Mint coins on prize grant. Per-prize bonus or default.
     */
    public function fromPrize(Model $recipient, string $prizeSlug, ?Model $ref = null): int
    {
        if (! $recipient instanceof User) {
            return 0;
        }

        $coins = (int) config(
            "coins.earn.prize.{$prizeSlug}",
            config('coins.earn.default_prize', 0),
        );

        if ($coins <= 0) {
            return 0;
        }

        $recipient->getWallet()->credit(
            amount: $coins,
            reason: "Prize bonus: {$prizeSlug}",
            ref: $ref,
            metadata: ['source' => 'prize', 'prize' => $prizeSlug],
        );

        return $coins;
    }
}
