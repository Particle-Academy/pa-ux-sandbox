<?php

namespace App\Listeners;

use App\Services\CoinMinter;
use LaravelFunLab\Events\XpAwarded;

class MintCoinsFromXp
{
    public function __construct(private readonly CoinMinter $minter) {}

    public function handle(XpAwarded $event): void
    {
        $this->minter->fromXp(
            recipient: $event->recipient,
            metricSlug: $event->gamedMetric->slug,
            xpAmount: $event->amount,
            reason: $event->reason,
        );
    }
}
