<?php

namespace App\Models;

use App\Exceptions\InsufficientFundsException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Wallet extends Model
{
    protected $fillable = [
        'user_id',
        'balance',
        'lifetime_earned',
        'lifetime_spent',
    ];

    protected $casts = [
        'balance' => 'integer',
        'lifetime_earned' => 'integer',
        'lifetime_spent' => 'integer',
    ];

    // Eloquent doesn't roundtrip DB column defaults back onto a freshly
    // created instance, so set them explicitly. Otherwise callers that
    // hit getWallet() right after creation see null instead of 0.
    protected $attributes = [
        'balance' => 0,
        'lifetime_earned' => 0,
        'lifetime_spent' => 0,
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class)->latest();
    }

    /**
     * Credit the wallet and record a transaction. The whole sequence
     * runs inside a DB transaction so balance + ledger never disagree.
     */
    public function credit(int $amount, string $reason, ?Model $ref = null, array $metadata = []): WalletTransaction
    {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('credit() amount must be positive.');
        }

        return DB::transaction(function () use ($amount, $reason, $ref, $metadata) {
            $fresh = self::query()->lockForUpdate()->find($this->id);
            $fresh->balance += $amount;
            $fresh->lifetime_earned += $amount;
            $fresh->save();
            $this->refresh();

            return $fresh->transactions()->create([
                'kind' => 'credit',
                'amount' => $amount,
                'reason' => $reason,
                'ref_type' => $ref?->getMorphClass(),
                'ref_id' => $ref?->getKey(),
                'metadata' => $metadata ?: null,
            ]);
        });
    }

    /**
     * Debit the wallet. Throws InsufficientFundsException if the locked
     * balance can't cover the request — caller decides whether to retry
     * or surface the error.
     */
    public function debit(int $amount, string $reason, ?Model $ref = null, array $metadata = []): WalletTransaction
    {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('debit() amount must be positive.');
        }

        return DB::transaction(function () use ($amount, $reason, $ref, $metadata) {
            $fresh = self::query()->lockForUpdate()->find($this->id);

            if ($fresh->balance < $amount) {
                throw InsufficientFundsException::for($fresh->balance, $amount);
            }

            $fresh->balance -= $amount;
            $fresh->lifetime_spent += $amount;
            $fresh->save();
            $this->refresh();

            return $fresh->transactions()->create([
                'kind' => 'debit',
                'amount' => $amount,
                'reason' => $reason,
                'ref_type' => $ref?->getMorphClass(),
                'ref_id' => $ref?->getKey(),
                'metadata' => $metadata ?: null,
            ]);
        });
    }
}
