<?php

namespace App\Services;

use App\Models\ShowcaseSubmission;
use App\Models\User;
use LaravelFunLab\Facades\LFL;

/**
 * Awards projects-xp (and the first-project achievement) when a showcase
 * submission is verified. Called from both the auto-scan job and the
 * admin manual-verify action.
 *
 * Idempotent: keyed on showcase_submissions.rewarded_at so a submission
 * that's verified, un-verified, and re-verified only ever pays out once.
 * Coins follow automatically via the XP/achievement earn pipeline
 * (CoinMinter listeners), so this service only touches XP + achievements.
 */
class ShowcaseRewards
{
    // A verified public project is high-signal off-site engagement.
    private const PROJECT_XP = 200;

    public function onVerified(ShowcaseSubmission $submission): void
    {
        if ($submission->rewarded_at !== null) {
            return; // already paid out
        }

        $user = $submission->user; // BelongsTo User
        if (! $user instanceof User) {
            return; // orphaned submission — nothing to credit
        }

        LFL::award('projects-xp')
            ->to($user)
            ->amount(self::PROJECT_XP)
            ->because("verified showcase submission #{$submission->id}")
            ->save();

        // First verified project unlocks the achievement; LFL::grant is a
        // no-op if they already have it.
        if (! $user->hasAchievement('first-project')) {
            LFL::grant('first-project')->to($user)->because('first verified project')->save();
        }

        $submission->forceFill(['rewarded_at' => now()])->save();
    }
}
