<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShowcaseSubmission extends Model
{
    protected $fillable = [
        'user_id',
        'kind',
        'url',
        'title',
        'description',
        'status',
        'scan_result',
        'thumbnail_url',
        'scanned_at',
        'featured_until',
    ];

    protected $casts = [
        'scan_result' => 'array',
        'scanned_at' => 'datetime',
        'featured_until' => 'datetime',
    ];

    public function isFeatured(): bool
    {
        return $this->featured_until !== null && $this->featured_until->isFuture();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
