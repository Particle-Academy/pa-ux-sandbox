<?php

namespace App\Models;

use Database\Factories\McpRequestFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * One JSON-RPC message the hosted MCP server answered, recorded after the
 * response was sent. `arguments` is sanitized JSON (secrets dropped, at most
 * `mcp-stats.arguments.max_bytes`); `ip_hash` is a daily-salted SHA-256.
 *
 * Status: `ok`, `error` (a JSON-RPC error, with `error_code`), `tool_error`
 * (a tool answered with isError), `stream` (an SSE reply, outcome unknown) or
 * `http_error` (a non-2xx reply with no JSON-RPC body).
 *
 * @property string $day YYYY-MM-DD, kept a plain string (no date cast) so range
 *                       queries compare identically on SQLite and Postgres
 * @property string $method
 * @property string|null $target
 * @property string|null $arguments
 * @property string $status
 * @property int|null $error_code
 * @property int|null $result_count
 * @property int $latency_ms
 */
class McpRequest extends Model
{
    /** @use HasFactory<McpRequestFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    /** Statuses that count as an error everywhere on the dashboard. */
    public const ERROR_STATUSES = ['error', 'tool_error', 'http_error'];

    protected $fillable = [
        'day',
        'session_id',
        'jsonrpc_id',
        'method',
        'target',
        'arguments',
        'arguments_truncated',
        'status',
        'error_code',
        'error_message',
        'result_count',
        'latency_ms',
        'http_status',
        'client_name',
        'client_version',
        'protocol_version',
        'ua_family',
        'ip_hash',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'arguments_truncated' => 'boolean',
            'error_code' => 'integer',
            'result_count' => 'integer',
            'latency_ms' => 'integer',
            'http_status' => 'integer',
            'created_at' => 'datetime',
        ];
    }
}
