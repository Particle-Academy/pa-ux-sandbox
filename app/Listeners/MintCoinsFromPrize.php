<?php

namespace App\Listeners;

use App\Services\CoinMinter;
use LaravelFunLab\Events\PrizeAwarded;

class MintCoinsFromPrize
{
    public function __construct(private readonly CoinMinter $minter) {}

    public function handle(PrizeAwarded $event): void
    {
        // PrizeAwarded carries a PrizeGrant on `$award`; the actual Prize
        // is reached via the grant's relation.
        $prize = method_exists($event->award, 'prize') ? $event->award->prize : $event->award;
        if ($prize === null) {
            return;
        }

        $this->minter->fromPrize(
            recipient: $event->recipient,
            prizeSlug: $prize->slug,
            ref: $prize,
        );
    }
}
