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

        return true;
    }
}
