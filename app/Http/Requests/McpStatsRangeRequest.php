<?php

namespace App\Http\Requests;

use App\Support\McpStats\StatsRange;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Validator;

/**
 * The date range every /admin/mcp page reads: a preset (`?days=7|30`) or a
 * custom span (`?from=YYYY-MM-DD&to=YYYY-MM-DD`), capped at
 * `mcp-stats.dashboard.max_range_days`. Authorization is the route's
 * `can:admin` middleware.
 */
class McpStatsRangeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $presets = implode(',', array_map('intval', (array) config('mcp-stats.dashboard.presets', [7, 30])));

        return [
            'days' => ['nullable', 'integer', 'in:'.$presets],
            'from' => ['nullable', 'date_format:Y-m-d', 'required_with:to'],
            'to' => ['nullable', 'date_format:Y-m-d', 'required_with:from', 'after_or_equal:from'],
        ];
    }

    /** @return array<int, callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty() || ! $this->filled('from') || ! $this->filled('to')) {
                    return;
                }

                $span = Carbon::parse((string) $this->input('from'))->diffInDays(Carbon::parse((string) $this->input('to'))) + 1;
                $max = (int) config('mcp-stats.dashboard.max_range_days', 400);
                if ($span > $max) {
                    $validator->errors()->add('from', "The range may be at most {$max} days.");
                }
            },
        ];
    }

    public function range(): StatsRange
    {
        if ($this->filled('from') && $this->filled('to')) {
            return StatsRange::between(
                Carbon::parse((string) $this->input('from')),
                Carbon::parse((string) $this->input('to')),
            );
        }

        return StatsRange::lastDays((int) ($this->input('days') ?: config('mcp-stats.dashboard.default_days', 7)));
    }
}
