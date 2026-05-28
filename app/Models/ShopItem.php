<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShopItem extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'description',
        'kind',
        'price',
        'active',
        'order',
        'metadata',
    ];

    protected $casts = [
        'price' => 'integer',
        'active' => 'boolean',
        'order' => 'integer',
        'metadata' => 'array',
    ];

    public function purchases(): HasMany
    {
        return $this->hasMany(ShopPurchase::class);
    }

    public function isCosmetic(): bool
    {
        return $this->kind === 'cosmetic';
    }

    public function isService(): bool
    {
        return $this->kind === 'service';
    }
}
