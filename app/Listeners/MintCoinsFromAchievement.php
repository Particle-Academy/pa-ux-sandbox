<?php

namespace App\Listeners;

use App\Services\CoinMinter;
use LaravelFunLab\Events\AchievementUnlocked;

class MintCoinsFromAchievement
{
    public function __construct(private readonly CoinMinter $minter) {}

    public function handle(AchievementUnlocked $event): void
    {
        $this->minter->fromAchievement(
            recipient: $event->recipient,
            achievementSlug: $event->achievement->slug,
            ref: $event->achievement,
        );
    }
}
