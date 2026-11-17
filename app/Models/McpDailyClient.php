<?php

namespace App\Models;

use Database\Factories\McpDailyClientFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Per day and client (name + version): distinct sessions that made a
 * request, requests and errors. Rebuilt by `mcp-stats:rollup`.
 */
class McpDailyClient extends Model
{
    /** @use HasFactory<McpDailyClientFactory> */
    use HasFactory;

    public $timestamps = false;

    protected $fillable = ['day', 'client_name', 'client_version', 'sessions', 'requests', 'errors'];

    protected function casts(): array
    {
        return [
            'sessions' => 'integer',
            'requests' => 'integer',
            'errors' => 'integer',
        ];
    }
}
