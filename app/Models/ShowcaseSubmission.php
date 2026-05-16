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
    ];

    protected $casts = [
        'scan_result' => 'array',
        'scanned_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
