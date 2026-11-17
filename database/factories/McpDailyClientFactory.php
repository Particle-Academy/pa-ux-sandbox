<?php

namespace Database\Factories;

use App\Models\McpDailyClient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<McpDailyClient>
 */
class McpDailyClientFactory extends Factory
{
    protected $model = McpDailyClient::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'day' => now()->toDateString(),
            'client_name' => 'claude-code',
            'client_version' => '2.1.0',
            'sessions' => 1,
            'requests' => 1,
            'errors' => 0,
        ];
    }
}
