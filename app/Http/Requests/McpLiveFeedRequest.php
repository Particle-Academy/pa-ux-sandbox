<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * The Live feed's cursor and size: `?since=<last id seen>&limit=<n>`. The
 * limit is clamped to `mcp-stats.live.row_cap` by the feed, so asking for
 * more is harmless; a malformed value is a 422. Authorization is the route's
 * `can:admin` middleware.
 */
class McpLiveFeedRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'since' => ['nullable', 'integer', 'min:0'],
            'limit' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function since(): int
    {
        return (int) ($this->validated('since') ?? 0);
    }

    public function limit(int $default): int
    {
        return (int) ($this->validated('limit') ?? $default);
    }
}
