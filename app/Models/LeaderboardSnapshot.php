<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeaderboardSnapshot extends Model
{
    protected $fillable = [
        'scope',
        'rows',
        'generated_at',
    ];

    protected $casts = [
        'rows' => 'array',
        'generated_at' => 'datetime',
    ];
}
