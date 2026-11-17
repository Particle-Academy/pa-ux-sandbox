<?php

namespace Database\Factories;

use App\Models\McpDailyArgValue;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<McpDailyArgValue>
 */
class McpDailyArgValueFactory extends Factory
{
    protected $model = McpDailyArgValue::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'day' => now()->toDateString(),
            'target' => 'search-components',
            'arg_key' => 'query',
            'arg_value' => 'term-'.bin2hex(random_bytes(3)),
            'calls' => 1,
            'empty_results' => 0,
            'errors' => 0,
        ];
    }
}
