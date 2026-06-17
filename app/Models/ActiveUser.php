<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A single live presence row — one per signed-in user (upserted on `user_id`)
 * or one per simulated visitor (upserted on `fake_key`). Powers the real-time
 * "active users" feed broadcast over the public `active-users` Echo channel.
 */
class ActiveUser extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'fake_key',
        'name',
        'avatar_url',
        'activity_type',
        'activity_label',
        'activity_at',
        'is_xp',
        'is_achievement',
        'last_active_at',
        'is_fake',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_xp' => 'boolean',
            'is_achievement' => 'boolean',
            'is_fake' => 'boolean',
            'activity_at' => 'datetime',
            'last_active_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
