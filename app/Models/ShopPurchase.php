<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ShopPurchase extends Model
{
    protected $fillable = [
        'user_id',
        'shop_item_id',
        'paid_amount',
        'expires_at',
        'ref_type',
        'ref_id',
        'metadata',
    ];

    protected $casts = [
        'paid_amount' => 'integer',
        'expires_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function shopItem(): BelongsTo
    {
        return $this->belongsTo(ShopItem::class);
    }

    public function ref(): MorphTo
    {
        return $this->morphTo();
    }

    public function isActive(): bool
    {
        return $this->expires_at === null || $this->expires_at->isFuture();
    }
}
