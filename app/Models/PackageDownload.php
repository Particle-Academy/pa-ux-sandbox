<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One package's public download counts on one registry (npm, Packagist or
 * PyPI), refreshed daily by `packages:fetch-downloads`.
 *
 * A NULL count is "not measured", never zero. See the migration.
 */
class PackageDownload extends Model
{
    protected $fillable = [
        'slug',
        'source',
        'name',
        'daily',
        'weekly',
        'monthly',
        'total',
        'fetched_at',
        'failed_at',
        'last_error',
        'consecutive_failures',
    ];

    protected function casts(): array
    {
        return [
            'daily' => 'integer',
            'weekly' => 'integer',
            'monthly' => 'integer',
            'total' => 'integer',
            'fetched_at' => 'datetime',
            'failed_at' => 'datetime',
            'consecutive_failures' => 'integer',
        ];
    }
}
