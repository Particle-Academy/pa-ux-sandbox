<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DreamArchive extends Model
{
    protected $fillable = [
        'slug',
        'title',
        'blurb',
        'pkg',
        'theme',
        'up_votes',
        'down_votes',
        'reason',
        'archived_at',
    ];

    protected $casts = [
        'archived_at' => 'datetime',
    ];
}
