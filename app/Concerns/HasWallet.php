<?php

namespace App\Concerns;

use App\Models\Wallet;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Gives any model a single coin Wallet. `wallet()` auto-creates the row
 * on first access so callers never have to null-check.
 */
trait HasWallet
{
    public function wallet(): HasOne
    {
        return $this->hasOne(Wallet::class);
    }

    public function getWallet(): Wallet
    {
        return $this->wallet()->firstOrCreate([]);
    }

    public function coinBalance(): int
    {
        return $this->getWallet()->balance;
    }
}
