<?php

namespace App\Support\McpStats;

/**
 * Fixed-bucket latency histogram. Buckets are mergeable, which is the point:
 * a p95 over 30 days cannot be computed from 30 daily p95s, but it can be
 * estimated from 30 merged histograms. Bounds come from
 * `mcp-stats.latency_buckets`; one extra bucket holds everything above the
 * last bound. Percentiles are linearly interpolated within their bucket.
 */
class LatencyHistogram
{
    /** @var list<int> */
    private array $bounds;

    /** @var list<int> */
    private array $counts;

    /** @param  list<int>  $counts */
    private function __construct(array $counts = [])
    {
        $this->bounds = array_values(array_map('intval', (array) config('mcp-stats.latency_buckets', [])));
        $this->counts = array_fill(0, count($this->bounds) + 1, 0);
        $this->merge($counts);
    }

    public static function empty(): self
    {
        return new self;
    }

    /** @param  list<int>|null  $counts */
    public static function from(?array $counts): self
    {
        return new self($counts ?? []);
    }

    public function add(int $ms): void
    {
        $this->counts[$this->bucketFor($ms)]++;
    }

    /** @param  array<int, int>|null  $counts */
    public function merge(?array $counts): void
    {
        foreach ((array) $counts as $index => $count) {
            if (isset($this->counts[$index])) {
                $this->counts[$index] += (int) $count;
            }
        }
    }

    public function count(): int
    {
        return array_sum($this->counts);
    }

    /**
     * Estimated latency (ms) at the given percentile, or null with no data.
     *
     * Interpolation can land anywhere in a bucket, including above the slowest
     * call actually recorded; pass that maximum as `$ceiling` and the estimate
     * never exceeds it.
     */
    public function percentile(float $p, ?float $ceiling = null): ?float
    {
        $estimate = $this->estimate($p);

        return $estimate !== null && $ceiling !== null ? min($estimate, $ceiling) : $estimate;
    }

    private function estimate(float $p): ?float
    {
        $total = $this->count();
        if ($total === 0) {
            return null;
        }

        $rank = max(1.0, ($p / 100) * $total);
        $seen = 0;
        foreach ($this->counts as $index => $count) {
            if ($count === 0) {
                continue;
            }
            if ($seen + $count >= $rank) {
                $lower = $index === 0 ? 0 : $this->bounds[$index - 1];
                $upper = $this->bounds[$index] ?? $lower * 2;
                $fraction = ($rank - $seen) / $count;

                return round($lower + ($upper - $lower) * $fraction, 1);
            }
            $seen += $count;
        }

        return (float) end($this->bounds);
    }

    /** @return list<int> */
    public function toArray(): array
    {
        return $this->counts;
    }

    /**
     * The buckets as chart rows: a label and a count.
     *
     * @return list<array{label: string, count: int}>
     */
    public function buckets(): array
    {
        $rows = [];
        foreach ($this->counts as $index => $count) {
            $label = isset($this->bounds[$index])
                ? '≤'.$this->bounds[$index].'ms'
                : '>'.end($this->bounds).'ms';
            $rows[] = ['label' => $label, 'count' => $count];
        }

        return $rows;
    }

    private function bucketFor(int $ms): int
    {
        foreach ($this->bounds as $index => $bound) {
            if ($ms <= $bound) {
                return $index;
            }
        }

        return count($this->bounds);
    }
}
