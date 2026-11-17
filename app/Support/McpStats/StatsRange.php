<?php

namespace App\Support\McpStats;

use Illuminate\Support\Carbon;

/**
 * An inclusive range of calendar days for the MCP dashboard.
 */
final class StatsRange
{
    private function __construct(
        public readonly Carbon $from,
        public readonly Carbon $to,
        public readonly string $preset,
    ) {}

    public static function lastDays(int $days): self
    {
        $days = max(1, $days);

        return new self(now()->startOfDay()->subDays($days - 1), now()->startOfDay(), $days.'d');
    }

    public static function between(Carbon $from, Carbon $to): self
    {
        return new self($from->copy()->startOfDay(), $to->copy()->startOfDay(), 'custom');
    }

    public function fromDay(): string
    {
        return $this->from->toDateString();
    }

    public function toDay(): string
    {
        return $this->to->toDateString();
    }

    public function days(): int
    {
        return (int) $this->from->diffInDays($this->to) + 1;
    }

    /** @return list<string> every day in the range, oldest first */
    public function dayList(): array
    {
        $days = [];
        for ($day = $this->from->copy(); $day->lte($this->to); $day->addDay()) {
            $days[] = $day->toDateString();
        }

        return $days;
    }

    /**
     * The query string that reproduces this range, for drill-down links.
     *
     * @return array<string, string|int>
     */
    public function query(): array
    {
        return $this->preset === 'custom'
            ? ['from' => $this->fromDay(), 'to' => $this->toDay()]
            : ['days' => $this->days()];
    }

    /** @return array{from: string, to: string, days: int, preset: string, query: array<string, string|int>, presets: list<int>} */
    public function toArray(): array
    {
        return [
            'from' => $this->fromDay(),
            'to' => $this->toDay(),
            'days' => $this->days(),
            'preset' => $this->preset,
            'query' => $this->query(),
            'presets' => array_values(array_map('intval', (array) config('mcp-stats.dashboard.presets', [7, 30]))),
        ];
    }
}
