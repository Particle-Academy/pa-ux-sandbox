<?php

namespace App\Models;

use Database\Factories\McpSessionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One session on the hosted MCP server, opened by `initialize`. Holds the
 * clientInfo every later request in the session is stamped with.
 *
 * @property string $session_id
 * @property string|null $client_name
 * @property string|null $client_version
 */
class McpSession extends Model
{
    /** @use HasFactory<McpSessionFactory> */
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'session_id',
        'client_name',
        'client_version',
        'protocol_version',
        'ua_family',
        'ip_hash',
        'request_count',
        'error_count',
        'first_seen_at',
        'last_seen_at',
    ];

    protected function casts(): array
    {
        return [
            'request_count' => 'integer',
            'error_count' => 'integer',
            'first_seen_at' => 'datetime',
            'last_seen_at' => 'datetime',
        ];
    }

    /** @return HasMany<McpRequest, $this> */
    public function requests(): HasMany
    {
        return $this->hasMany(McpRequest::class, 'session_id', 'session_id');
    }
}
