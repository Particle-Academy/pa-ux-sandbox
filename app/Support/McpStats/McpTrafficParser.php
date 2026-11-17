<?php

namespace App\Support\McpStats;

use Illuminate\Support\Str;

/**
 * Reads one HTTP exchange with the MCP server — the JSON-RPC request body and
 * the reply — into the rows `mcp_requests` stores. Pure: no I/O, no clock.
 *
 * A body may hold one message or a batch; a reply may be one message, a
 * batch, empty (202, for notifications) or an SSE stream, whose outcome is
 * not known here and is recorded as `stream`.
 */
class McpTrafficParser
{
    public function __construct(private readonly ArgumentSanitizer $sanitizer) {}

    /**
     * @return list<array{
     *     jsonrpc_id: string|null,
     *     method: string,
     *     target: string|null,
     *     arguments: string|null,
     *     arguments_truncated: bool,
     *     status: string,
     *     error_code: int|null,
     *     error_message: string|null,
     *     result_count: int|null,
     *     client_name: string|null,
     *     client_version: string|null,
     *     protocol_version: string|null,
     * }>
     */
    public function parse(string $body, ?string $reply, int $httpStatus, bool $streamed): array
    {
        if (strlen($body) > (int) config('mcp-stats.max_body_bytes', 262144)) {
            return [$this->row(['method' => '(oversized)'], $this->outcome(null, $httpStatus, $streamed))];
        }

        $decoded = json_decode($body, true);
        if (! is_array($decoded)) {
            return [$this->row(['method' => '(invalid)'], $this->outcome($this->first($this->replies($reply)), $httpStatus, $streamed))];
        }

        $messages = array_is_list($decoded) ? $decoded : [$decoded];
        $replies = $this->replies($reply);
        $byId = [];
        foreach ($replies as $message) {
            if (array_key_exists('id', $message) && $message['id'] !== null) {
                $byId[(string) $message['id']] = $message;
            }
        }

        $rows = [];
        foreach ($messages as $message) {
            if (! is_array($message)) {
                continue;
            }

            $method = is_string($message['method'] ?? null) ? Str::limit($message['method'], 60, '') : '(none)';
            $isNotification = ! array_key_exists('id', $message) || str_starts_with($method, 'notifications/');
            if ($isNotification && ! config('mcp-stats.record_notifications', false)) {
                continue;
            }

            $id = array_key_exists('id', $message) && $message['id'] !== null ? (string) $message['id'] : null;
            $replyMessage = $id !== null ? ($byId[$id] ?? (count($messages) === 1 ? $this->first($replies) : null)) : null;

            $rows[] = $this->row($this->describe($message, $method, $id), $this->outcome($replyMessage, $httpStatus, $streamed, $method));
        }

        return $rows;
    }

    /**
     * @param  array<string, mixed>  $message
     * @return array<string, mixed>
     */
    private function describe(array $message, string $method, ?string $id): array
    {
        $params = is_array($message['params'] ?? null) ? $message['params'] : [];
        $target = null;
        $arguments = null;
        $clientName = null;
        $clientVersion = null;
        $protocol = null;

        switch ($method) {
            case 'tools/call':
            case 'prompts/get':
                $target = is_string($params['name'] ?? null) ? $params['name'] : null;
                $arguments = $params['arguments'] ?? null;
                break;
            case 'resources/read':
                $target = is_string($params['uri'] ?? null) ? $params['uri'] : null;
                break;
            case 'initialize':
                $info = is_array($params['clientInfo'] ?? null) ? $params['clientInfo'] : [];
                $clientName = is_string($info['name'] ?? null) ? Str::limit($info['name'], 100, '') : null;
                $clientVersion = is_string($info['version'] ?? null) ? Str::limit($info['version'], 50, '') : null;
                $protocol = is_string($params['protocolVersion'] ?? null) ? Str::limit($params['protocolVersion'], 20, '') : null;
                break;
            default:
                $arguments = $params;
        }

        $sanitized = $this->sanitizer->sanitize($arguments);

        return [
            'jsonrpc_id' => $id !== null ? Str::limit($id, 64, '') : null,
            'method' => $method,
            'target' => $target !== null ? Str::limit($target, 191, '') : null,
            'arguments' => $sanitized['json'],
            'arguments_truncated' => $sanitized['truncated'],
            'client_name' => $clientName,
            'client_version' => $clientVersion,
            'protocol_version' => $protocol,
        ];
    }

    /**
     * @param  array<string, mixed>|null  $reply
     * @return array{status: string, error_code: int|null, error_message: string|null, result_count: int|null}
     */
    private function outcome(?array $reply, int $httpStatus, bool $streamed, string $method = ''): array
    {
        $outcome = ['status' => 'ok', 'error_code' => null, 'error_message' => null, 'result_count' => null];

        if ($streamed) {
            $outcome['status'] = 'stream';

            return $outcome;
        }

        if ($reply === null) {
            if ($httpStatus >= 400) {
                $outcome['status'] = 'http_error';
                $outcome['error_code'] = $httpStatus;
            }

            return $outcome;
        }

        if (is_array($reply['error'] ?? null)) {
            $outcome['status'] = 'error';
            $outcome['error_code'] = is_numeric($reply['error']['code'] ?? null) ? (int) $reply['error']['code'] : null;
            $outcome['error_message'] = $this->message($reply['error']['message'] ?? null);

            return $outcome;
        }

        $result = is_array($reply['result'] ?? null) ? $reply['result'] : [];
        $text = $this->firstText($result);

        if (($result['isError'] ?? false) === true) {
            $outcome['status'] = 'tool_error';
            $outcome['error_message'] = $this->message($text);

            return $outcome;
        }

        $outcome['result_count'] = $this->resultCount($method, $result, $text);

        return $outcome;
    }

    /** @param  array<string, mixed>  $result */
    private function resultCount(string $method, array $result, ?string $text): ?int
    {
        foreach (['tools', 'resources', 'prompts'] as $list) {
            if ($method === $list.'/list' && is_array($result[$list] ?? null)) {
                return count($result[$list]);
            }
        }

        if ($method !== 'tools/call' || $text === null || strlen($text) > (int) config('mcp-stats.max_result_bytes', 1048576)) {
            return null;
        }

        $payload = json_decode($text, true);
        if (is_array($payload)) {
            if (is_int($payload['count'] ?? null)) {
                return $payload['count'];
            }
            foreach (['items', 'results', 'packages', 'nodes'] as $key) {
                if (is_array($payload[$key] ?? null) && array_is_list($payload[$key])) {
                    return count($payload[$key]);
                }
            }
        }

        return null;
    }

    /** @param  array<string, mixed>  $result */
    private function firstText(array $result): ?string
    {
        foreach ((array) ($result['content'] ?? []) as $part) {
            if (is_array($part) && is_string($part['text'] ?? null)) {
                return $part['text'];
            }
        }

        return null;
    }

    private function message(mixed $text): ?string
    {
        return is_string($text) && $text !== '' ? Str::limit($text, 250) : null;
    }

    /** @return list<array<string, mixed>> */
    private function replies(?string $reply): array
    {
        if ($reply === null || $reply === '') {
            return [];
        }

        $decoded = json_decode($reply, true);
        if (! is_array($decoded)) {
            return [];
        }

        return array_values(array_filter(array_is_list($decoded) ? $decoded : [$decoded], 'is_array'));
    }

    /**
     * @param  list<array<string, mixed>>  $replies
     * @return array<string, mixed>|null
     */
    private function first(array $replies): ?array
    {
        return $replies[0] ?? null;
    }

    /**
     * @param  array<string, mixed>  $description
     * @param  array<string, mixed>  $outcome
     * @return array<string, mixed>
     */
    private function row(array $description, array $outcome): array
    {
        return array_merge([
            'jsonrpc_id' => null,
            'method' => '(none)',
            'target' => null,
            'arguments' => null,
            'arguments_truncated' => false,
            'client_name' => null,
            'client_version' => null,
            'protocol_version' => null,
        ], $description, $outcome);
    }
}
