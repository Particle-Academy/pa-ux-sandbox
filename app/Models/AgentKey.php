<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * An agent access key — how an AI agent acts on a user's behalf against the
 * showcase MCP tools (register / status / rescan), attributed and revocable.
 *
 * Plaintext form: `fancy_agent_<40 hex>`, shown ONCE at mint; only the SHA-256
 * hash is stored. Resolution touches `last_used_at` so users can audit usage.
 */
class AgentKey extends Model
{
    public const PREFIX = 'fancy_agent_';

    protected $fillable = [
        'user_id',
        'name',
        'token_hash',
        'last_used_at',
        'revoked_at',
    ];

    protected function casts(): array
    {
        return [
            'last_used_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isRevoked(): bool
    {
        return $this->revoked_at !== null;
    }

    /**
     * Mint a key for a user. Returns the model plus the plaintext — the only
     * time the plaintext ever exists.
     *
     * @return array{key: self, plaintext: string}
     */
    public static function mint(User $user, string $name): array
    {
        $plaintext = self::PREFIX.Str::lower(Str::random(40));

        $key = self::query()->create([
            'user_id' => $user->id,
            'name' => $name,
            'token_hash' => hash('sha256', $plaintext),
        ]);

        return ['key' => $key, 'plaintext' => $plaintext];
    }

    /** Resolve a plaintext key to its active record (touching last_used_at), or null. */
    public static function resolve(?string $plaintext): ?self
    {
        if (! is_string($plaintext) || ! str_starts_with($plaintext, self::PREFIX)) {
            return null;
        }

        $key = self::query()
            ->where('token_hash', hash('sha256', $plaintext))
            ->whereNull('revoked_at')
            ->first();

        $key?->forceFill(['last_used_at' => now()])->save();

        return $key;
    }
}
