<?php

namespace Database\Factories;

use App\Models\McpRequest;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<McpRequest>
 */
class McpRequestFactory extends Factory
{
    protected $model = McpRequest::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'day' => now()->toDateString(),
            'session_id' => null,
            'jsonrpc_id' => (string) random_int(1, 999),
            'method' => 'tools/list',
            'target' => null,
            'arguments' => null,
            'arguments_truncated' => false,
            'status' => 'ok',
            'error_code' => null,
            'error_message' => null,
            'result_count' => null,
            'latency_ms' => random_int(1, 200),
            'http_status' => 200,
            'client_name' => null,
            'client_version' => null,
            'protocol_version' => '2025-06-18',
            'ua_family' => 'claude-code',
            'ip_hash' => hash('sha256', Str::random(16)),
            'created_at' => now(),
        ];
    }

    /**
     * A `tools/call` of the named tool with these (already sanitized) arguments.
     *
     * @param  array<string, mixed>  $arguments
     */
    public function tool(string $name, array $arguments = []): static
    {
        return $this->state(fn (): array => [
            'method' => 'tools/call',
            'target' => $name,
            'arguments' => json_encode((object) $arguments),
        ]);
    }

    /** The tool answered with `isError: true`. */
    public function toolError(string $message = 'Something went wrong.'): static
    {
        return $this->state(fn (): array => [
            'status' => 'tool_error',
            'error_message' => $message,
        ]);
    }
}
