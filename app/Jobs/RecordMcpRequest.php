<?php

namespace App\Jobs;

use App\Support\McpStats\McpUsageRecorder;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

/**
 * Persists one captured MCP exchange. The payload is already reduced to what
 * may be stored (no raw IP, no full bodies), so it is safe on any queue.
 *
 * Analytics must never cost a caller anything: a failure is reported and
 * dropped, never retried into a backlog.
 */
class RecordMcpRequest implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    /**
     * @param  array{at: string, session_id: string|null, http_status: int, latency_ms: int, ip_hash: string|null, ua_family: string, protocol_version: string|null, rows: list<array<string, mixed>>}  $payload
     */
    public function __construct(public array $payload) {}

    public function handle(McpUsageRecorder $recorder): void
    {
        try {
            $recorder->store($this->payload);
        } catch (Throwable $e) {
            report($e);
        }
    }
}
