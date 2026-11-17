<?php

namespace App\Support\McpStats;

use App\Models\McpRequest;
use App\Models\McpSession;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Two halves of recording one MCP exchange.
 *
 * `capture()` runs in the request process AFTER the response has been sent
 * (RecordMcpUsage is terminable) and reduces the exchange to a small payload:
 * parsed rows, the session id, a daily-salted IP hash and a user-agent family.
 * The raw IP and the full bodies never leave this method, so a queued payload
 * carries nothing that may not be stored.
 *
 * `store()` writes that payload: the session row, then one request row per
 * message, each stamped with the session's client.
 */
class McpUsageRecorder
{
    public function __construct(
        private readonly McpTrafficParser $parser,
        private readonly IpHasher $ipHasher,
        private readonly UserAgentFamily $userAgents,
    ) {}

    /**
     * @return array{at: string, session_id: string|null, http_status: int, latency_ms: int, ip_hash: string|null, ua_family: string, protocol_version: string|null, rows: list<array<string, mixed>>}|null
     */
    public function capture(Request $request, Response $response, int $latencyMs): ?array
    {
        $streamed = $response instanceof StreamedResponse;
        $reply = $streamed ? null : $response->getContent();

        $rows = $this->parser->parse(
            (string) $request->getContent(),
            is_string($reply) ? $reply : null,
            $response->getStatusCode(),
            $streamed,
        );

        if ($rows === []) {
            return null;
        }

        $at = now();
        $session = $response->headers->get('MCP-Session-Id') ?: $request->header('MCP-Session-Id');
        $protocol = $request->header('MCP-Protocol-Version');

        return [
            'at' => $at->toIso8601String(),
            'session_id' => is_string($session) && $session !== '' ? Str::limit($session, 64, '') : null,
            'http_status' => $response->getStatusCode(),
            'latency_ms' => max(0, $latencyMs),
            'ip_hash' => $this->ipHasher->hash($request->ip(), $at),
            'ua_family' => $this->userAgents->of($request->userAgent()),
            'protocol_version' => is_string($protocol) && $protocol !== '' ? Str::limit($protocol, 20, '') : null,
            'rows' => $rows,
        ];
    }

    /**
     * @param  array{at: string, session_id: string|null, http_status: int, latency_ms: int, ip_hash: string|null, ua_family: string, protocol_version: string|null, rows: list<array<string, mixed>>}  $payload
     */
    public function store(array $payload): void
    {
        $at = Carbon::parse($payload['at']);
        $sessionId = $payload['session_id'];
        $session = $sessionId !== null ? $this->session($sessionId, $payload, $at) : null;

        $errors = 0;
        foreach ($payload['rows'] as $row) {
            if (in_array($row['status'], McpRequest::ERROR_STATUSES, true)) {
                $errors++;
            }

            McpRequest::query()->create([
                'day' => $at->toDateString(),
                'session_id' => $sessionId,
                'jsonrpc_id' => $row['jsonrpc_id'],
                'method' => $row['method'],
                'target' => $row['target'],
                'arguments' => $row['arguments'],
                'arguments_truncated' => $row['arguments_truncated'],
                'status' => $row['status'],
                'error_code' => $row['error_code'],
                'error_message' => $row['error_message'],
                'result_count' => $row['result_count'],
                'latency_ms' => $payload['latency_ms'],
                'http_status' => $payload['http_status'],
                'client_name' => $session?->client_name ?? $row['client_name'],
                'client_version' => $session?->client_version ?? $row['client_version'],
                'protocol_version' => $row['protocol_version'] ?? $payload['protocol_version'] ?? $session?->protocol_version,
                'ua_family' => $payload['ua_family'],
                'ip_hash' => $payload['ip_hash'],
                'created_at' => $at,
            ]);
        }

        if ($session !== null) {
            // Incremented in the database, not read-modify-written, so two
            // requests in one session recorded at once both count.
            McpSession::query()->whereKey($session->getKey())->incrementEach(
                ['request_count' => count($payload['rows']), 'error_count' => $errors],
                ['last_seen_at' => $at],
            );
        }
    }

    /**
     * The session row for this exchange: created by `initialize` (which also
     * carries the clientInfo), or lazily for a session first seen mid-stream.
     *
     * @param  array<string, mixed>  $payload
     */
    private function session(string $sessionId, array $payload, Carbon $at): McpSession
    {
        $init = collect($payload['rows'])->firstWhere('method', 'initialize');

        $session = McpSession::query()->createOrFirst(['session_id' => $sessionId], [
            'client_name' => $init['client_name'] ?? null,
            'client_version' => $init['client_version'] ?? null,
            'protocol_version' => $init['protocol_version'] ?? $payload['protocol_version'],
            'ua_family' => $payload['ua_family'],
            'ip_hash' => $payload['ip_hash'],
            'request_count' => 0,
            'error_count' => 0,
            'first_seen_at' => $at,
            'last_seen_at' => $at,
        ]);

        if ($init !== null && $session->client_name === null && $init['client_name'] !== null) {
            $session->forceFill([
                'client_name' => $init['client_name'],
                'client_version' => $init['client_version'],
                'protocol_version' => $init['protocol_version'] ?? $session->protocol_version,
            ])->save();

            // Requests recorded before this initialize landed (the client did
            // not wait for it) get the client too.
            McpRequest::query()
                ->where('session_id', $sessionId)
                ->whereNull('client_name')
                ->update(['client_name' => $init['client_name'], 'client_version' => $init['client_version']]);
        }

        return $session;
    }
}
