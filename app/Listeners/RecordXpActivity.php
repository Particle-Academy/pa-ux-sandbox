<?php

namespace App\Listeners;

use App\Models\User;
use App\Services\ActiveUserRecorder;
use LaravelFunLab\Events\XpAwarded;

/**
 * Lights the XP glow on the live presence feed whenever a user earns XP.
 * Auto-discovered via the typehint (like MintCoinsFromXp). Non-user recipients
 * (e.g. a site/org awardable) have no presence row, so they're skipped.
 */
class RecordXpActivity
{
    public function __construct(private readonly ActiveUserRecorder $recorder) {}

    public function handle(XpAwarded $event): void
    {
        if (! $event->recipient instanceof User) {
            return;
        }

        $reason = $event->reason ?? 'activity';

        $this->recorder->record(
            user: $event->recipient,
            activityType: 'xp',
            activityLabel: "earned {$event->amount} XP — {$reason}",
            isXp: true,
        );
    }
}
