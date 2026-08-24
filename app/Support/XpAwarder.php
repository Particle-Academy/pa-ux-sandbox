<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use LaravelFunLab\Facades\LFL;

/**
 * Thin wrapper around LFL::award() that adds:
 *   - guest-safe no-op (so callers don't have to null-check)
 *   - opt-out skip
 *   - per-(user, metric, throttleKey) cooldown so the same signal can't
 *     be farmed by refresh / replay
 *
 * Callers pass a stable `throttleKey` (e.g. the route name or demo slug)
 * plus a window in seconds. Most page-view-style signals use a 24h
 * window; per-interaction signals use a much shorter one.
 */
class XpAwarder
{
    /**
     * Most awards one user may earn for one metric inside
     * {@see self::AWARD_WINDOW_SECONDS}. Deliberately generous -- this is a
     * backstop against minting, not a budget anyone should feel.
     */
    private const MAX_AWARDS_PER_WINDOW = 40;

    private const AWARD_WINDOW_SECONDS = 3600;

    /**
     * Award XP if the user is eligible AND the (user, metric, key) bucket
     * hasn't been hit inside the throttle window. Returns true on award,
     * false on any skip path (guest, opted out, throttled).
     */
    public static function award(
        ?User $user,
        string $metric,
        int $amount,
        string $reason,
        string $throttleKey,
        int $throttleSeconds = 86400,
    ): bool {
        if ($user === null || $user->isOptedOut()) {
            return false;
        }

        $cacheKey = "xp:{$user->id}:{$metric}:{$throttleKey}";
        if (Cache::has($cacheKey)) {
            return false;
        }

        // A CEILING ON DISTINCT BUCKETS, not just on each bucket.
        //
        // The per-bucket cooldown above is keyed on a string the CALLER
        // supplies, and both XP endpoints built theirs from request input. So
        // varying the string opened unbounded fresh buckets and the hour
        // cooldown bounded nothing: ~2,100 points a minute against a level
        // threshold that gates a paid entitlement.
        //
        // The endpoints now validate what they accept, but that is only
        // possible where the vocabulary is knowable -- component slugs are, MCP
        // tool names are not. This cap is what makes the CONTENT of the key
        // irrelevant, which is the property that was actually missing. A per
        // user RATE limit could never provide it, because the attacker chooses
        // the key rather than the rate.
        //
        // Set well above real use: a person browsing demos for an hour trips
        // nothing, and an agentic session invoking many distinct tools still
        // gets credited for the first several dozen.
        $ceilingKey = "xp-awards:{$user->id}:{$metric}";
        $awardsThisWindow = (int) Cache::get($ceilingKey, 0);
        if ($awardsThisWindow >= self::MAX_AWARDS_PER_WINDOW) {
            return false;
        }

        // XP is a non-critical side-effect — a missing/inactive metric or any
        // LFL failure must never break the page. Log and skip; leave the
        // cooldown unset so the award retries once the data is fixed (e.g. the
        // FunLabSeeder is run).
        try {
            LFL::award($metric)
                ->to($user)
                ->amount($amount)
                ->because($reason)
                ->save();
        } catch (\Throwable $e) {
            Log::warning("XP award skipped for metric '{$metric}': ".$e->getMessage());

            return false;
        }

        Cache::put($cacheKey, true, $throttleSeconds);

        // Counted only on an ACTUAL award. Counting attempts would let a
        // failed or throttled call burn a legitimate user's allowance, and the
        // skip paths above already return before reaching here.
        Cache::put($ceilingKey, $awardsThisWindow + 1, self::AWARD_WINDOW_SECONDS);

        return true;
    }
}
