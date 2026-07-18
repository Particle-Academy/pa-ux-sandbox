<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Concerns\HasWallet;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Cashier\Billable;
use LaravelFunLab\Traits\Awardable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use Awardable, Billable, HasFactory, HasWallet, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * Privilege / moderation columns (is_admin, pro_override, suspended_at,
     * suspension_reason) are deliberately EXCLUDED from this whitelist, so a
     * stray `create($request->all())` / `fill()` can never escalate an account.
     * The admin screens set them explicitly via forceFill() at their (gated)
     * call sites.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'github_id',
        'github_username',
        'avatar_url',
        'cosmetic_slots',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'pro_override' => 'boolean',
            'suspended_at' => 'datetime',
            'cosmetic_slots' => 'array',
        ];
    }

    /** A suspended account: login blocked, sites delisted, Pro frozen. */
    public function isSuspended(): bool
    {
        return $this->suspended_at !== null;
    }

    /** @return HasMany<ShowcaseSubmission, $this> */
    public function submissions(): HasMany
    {
        return $this->hasMany(ShowcaseSubmission::class);
    }

    /** @return HasMany<AgentKey, $this> */
    public function agentKeys(): HasMany
    {
        return $this->hasMany(AgentKey::class);
    }
}
