<?php

namespace App\Models;

use FancyHeuristics\Models\HeuristicsSite;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ShowcaseSubmission extends Model
{
    /** Curated category taxonomy (slug => label). */
    public const CATEGORIES = [
        'developer-tools' => 'Developer Tools',
        'productivity' => 'Productivity',
        'ecommerce' => 'E-commerce',
        'education' => 'Education',
        'games' => 'Entertainment / Games',
        'portfolio' => 'Portfolio',
        'social' => 'Social / Community',
        'finance' => 'Finance / Crypto',
        'health' => 'Health / Wellness',
        'ai-agents' => 'AI / Agents',
        'other' => 'Other',
    ];

    protected $fillable = [
        'user_id',
        'site_key',
        'kind',
        'url',
        'title',
        'description',
        'category',
        'nsfw_declared',
        'made_for_children',
        'nsfw_status',
        'nsfw_flag_reason',
        'suspended_at',
        'suspension_reason',
        'style',
        'mode',
        'status',
        'scan_result',
        'packages',
        'registered_via',
        'agent_name',
        'thumbnail_url',
        'scanned_at',
        'featured_until',
        'rewarded_at',
        'promotion_rewarded_at',
    ];

    protected $casts = [
        'scan_result' => 'array',
        'packages' => 'array',
        'nsfw_declared' => 'boolean',
        'made_for_children' => 'boolean',
        'suspended_at' => 'datetime',
        'scanned_at' => 'datetime',
        'featured_until' => 'datetime',
        'rewarded_at' => 'datetime',
        'promotion_rewarded_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        // Auto-generate a unique, pixel-friendly site key on create. The key
        // becomes the pixel's `data-site` and ties the site to its later
        // heuristics data. Random is "deterministic enough"; we re-roll on the
        // astronomically unlikely collision so the unique index never trips.
        static::creating(function (ShowcaseSubmission $submission): void {
            if (! empty($submission->site_key)) {
                return;
            }

            do {
                $key = Str::lower(Str::random(12));
            } while (static::query()->where('site_key', $key)->exists());

            $submission->site_key = $key;
        });

        // Register the site with Fancy Heuristics so the Fancy Pixel's piped
        // interaction data (keyed by the same site_key) lands against a known
        // site — the host-side destination for the Analytics Suite. `visible`
        // starts false; the showcase's own per-kind verification gates the
        // public listing.
        static::created(function (ShowcaseSubmission $submission): void {
            HeuristicsSite::firstOrCreate(
                ['site_key' => $submission->site_key],
                ['url' => $submission->url, 'visible' => false],
            );
        });
    }

    public function isFeatured(): bool
    {
        return $this->featured_until !== null && $this->featured_until->isFuture();
    }

    public function isSuspended(): bool
    {
        return $this->suspended_at !== null;
    }

    /** Held out of the public listing pending NSFW review. */
    public function isHeldForReview(): bool
    {
        return $this->nsfw_status === 'flagged';
    }

    /** NSFW — self-declared or admin-confirmed. */
    public function isNsfw(): bool
    {
        return $this->nsfw_declared || $this->nsfw_status === 'confirmed';
    }

    /**
     * Shown in the public showcase? Verified, not suspended, not NSFW
     * (declared/flagged/confirmed). Children's sites ARE listed (badged).
     */
    public function isPubliclyListable(): bool
    {
        return $this->status === 'verified'
            && $this->suspended_at === null
            && ! $this->nsfw_declared
            && ! in_array($this->nsfw_status, ['flagged', 'confirmed'], true)
            && ! ($this->user?->isSuspended() ?? false);
    }

    /** No screenshots for NSFW (declared/flagged/confirmed) or children's sites. */
    public function shouldCaptureScreenshot(): bool
    {
        return ! $this->made_for_children
            && ! $this->nsfw_declared
            && ! in_array($this->nsfw_status, ['flagged', 'confirmed'], true);
    }

    /** Children's sites get no behavioral tracking (COPPA / GDPR-K). */
    public function collectsBehavior(): bool
    {
        return ! $this->made_for_children;
    }

    /** Mirror the public-listing eligibility onto the linked HeuristicsSite. */
    public function syncHeuristicsVisibility(): void
    {
        HeuristicsSite::query()
            ->where('site_key', $this->site_key)
            ->update(['visible' => $this->isPubliclyListable()]);
    }

    /** Verified + listed + not suspended/NSFW/held, owner not suspended. */
    public function scopePubliclyListable($query)
    {
        return $query->where('status', 'verified')
            ->whereNull('suspended_at')
            ->where('nsfw_declared', false)
            ->whereNotIn('nsfw_status', ['flagged', 'confirmed'])
            ->whereDoesntHave('user', fn ($q) => $q->whereNotNull('suspended_at'));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
