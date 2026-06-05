<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ShowcaseSubmission extends Model
{
    protected $fillable = [
        'user_id',
        'site_key',
        'kind',
        'url',
        'title',
        'description',
        'style',
        'mode',
        'status',
        'scan_result',
        'thumbnail_url',
        'scanned_at',
        'featured_until',
        'rewarded_at',
        'promotion_rewarded_at',
    ];

    protected $casts = [
        'scan_result' => 'array',
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
    }

    public function isFeatured(): bool
    {
        return $this->featured_until !== null && $this->featured_until->isFuture();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
