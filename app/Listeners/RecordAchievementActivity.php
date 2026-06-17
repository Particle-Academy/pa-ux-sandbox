<?php

namespace App\Listeners;

use App\Models\User;
use App\Services\ActiveUserRecorder;
use LaravelFunLab\Events\AchievementUnlocked;

/**
 * Lights the achievement glow on the live presence feed whenever a user
 * unlocks one. Auto-discovered via the typehint (like MintCoinsFromAchievement).
 */
class RecordAchievementActivity
{
    public function __construct(private readonly ActiveUserRecorder $recorder) {}

    public function handle(AchievementUnlocked $event): void
    {
        if (! $event->recipient instanceof User) {
            return;
        }

        $this->recorder->record(
            user: $event->recipient,
            activityType: 'achievement',
            activityLabel: "unlocked {$event->getAchievementName()}",
            isAchievement: true,
        );
    }
}
