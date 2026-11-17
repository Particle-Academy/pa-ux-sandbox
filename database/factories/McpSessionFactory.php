<?php

namespace Database\Factories;

use App\Models\McpSession;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<McpSession>
 */
class McpSessionFactory extends Factory
{
    protected $model = McpSession::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $seen = now();

        return [
            'session_id' => (string) Str::uuid(),
            'client_name' => ['claude-code', 'cursor', 'codex', 'vscode'][random_int(0, 3)],
            'client_version' => random_int(0, 3).'.'.random_int(0, 9).'.'.random_int(0, 9),
            'protocol_version' => '2025-06-18',
            'ua_family' => 'claude-code',
            'ip_hash' => hash('sha256', Str::random(16)),
            'request_count' => 0,
            'error_count' => 0,
            'first_seen_at' => $seen,
            'last_seen_at' => $seen,
        ];
    }
}
