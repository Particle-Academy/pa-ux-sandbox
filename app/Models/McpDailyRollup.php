<?php

namespace App\Models;

use Database\Factories\McpDailyRollupFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Requests for one day, grouped by method, target, client and outcome, with
 * a latency histogram (see App\Support\McpStats\LatencyHistogram). Rebuilt by
 * `mcp-stats:rollup`; `error_code` is 0 when there was none.
 */
class McpDailyRollup extends Model
{
    /** @use HasFactory<McpDailyRollupFactory> */
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'day',
        'method',
        'target',
        'client_name',
        'client_version',
        'status',
        'error_code',
        'requests',
        'empty_results',
        'latency_sum',
        'latency_max',
        'latency_histogram',
        'rolled_at',
    ];

    protected function casts(): array
    {
        return [
            'error_code' => 'integer',
            'requests' => 'integer',
            'empty_results' => 'integer',
            'latency_sum' => 'integer',
            'latency_max' => 'integer',
            'latency_histogram' => 'array',
            'rolled_at' => 'datetime',
        ];
    }
}
