<?php

namespace Database\Factories;

use App\Models\McpDailyRollup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<McpDailyRollup>
 */
class McpDailyRollupFactory extends Factory
{
    protected $model = McpDailyRollup::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'day' => now()->toDateString(),
            'method' => 'tools/call',
            'target' => 'search-components',
            'client_name' => 'claude-code',
            'client_version' => '2.1.0',
            'status' => 'ok',
            'error_code' => 0,
            'requests' => 1,
            'empty_results' => 0,
            'latency_sum' => 10,
            'latency_max' => 10,
            'latency_histogram' => [],
            'rolled_at' => now(),
        ];
    }
}
