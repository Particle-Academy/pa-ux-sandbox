<?php

namespace App\Services;

use App\Events\ActiveUserActivity;
use App\Models\ActiveUser;
use App\Models\User;

/**
 * Single write-path for the live presence feed. Upserts the signed-in user's
 * row (one per user, keyed on `user_id`) and broadcasts the change on the
 * public `active-users` channel. Used by both the TrackActiveUser middleware
 * (page activity) and the LFL glow listeners (XP / achievement awards).
 */
class ActiveUserRecorder
{
    /**
     * Upsert the user's presence row to "now" and broadcast it.
     */
    public function record(
        User $user,
        string $activityType,
        string $activityLabel,
        bool $isXp = false,
        bool $isAchievement = false,
    ): ActiveUser {
        $now = now();

        $activeUser = ActiveUser::updateOrCreate(
            ['user_id' => $user->id],
            [
                'name' => $user->name,
                'avatar_url' => $user->avatar_url,
                'activity_type' => $activityType,
                'activity_label' => $activityLabel,
                'activity_at' => $now,
                'is_xp' => $isXp,
                'is_achievement' => $isAchievement,
                'last_active_at' => $now,
                'is_fake' => false,
            ],
        );

        ActiveUserActivity::dispatch($activeUser);

        return $activeUser;
    }
}
