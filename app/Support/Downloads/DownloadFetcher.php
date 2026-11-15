<?php

namespace App\Support\Downloads;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;
use RuntimeException;

/**
 * Reads public download counts from npm, Packagist and pypistats.org.
 *
 * All-or-nothing per target: if any request for a package fails, nothing from
 * it is returned, so a half-measured total (one npm range chunk of three) can
 * never overwrite a complete one. The caller keeps the last known value.
 *
 * Requests are paced by `package-downloads.delay_ms` across the whole run, not
 * per target, so a polyglot package does not fire three registries at once.
 */
final class DownloadFetcher
{
    /** npm's range endpoint refuses anything longer. */
    private const NPM_MAX_CHUNK_MONTHS = 18;

    private bool $sentAny = false;

    /**
     * @return array{daily: ?int, weekly: ?int, monthly: ?int, total: ?int}
     *
     * @throws RuntimeException when any request fails or a payload lacks its numbers
     */
    public function fetch(string $source, string $name): array
    {
        return match ($source) {
            PublishedNames::NPM => $this->npm($name),
            PublishedNames::PACKAGIST => $this->packagist($name),
            PublishedNames::PYPI => $this->pypi($name),
            default => throw new RuntimeException("unknown source {$source}"),
        };
    }

    /**
     * The URLs a fetch would request, for `--dry-run`. npm's range chunks are
     * listed in full, back to the configured history start; a real run stops
     * at the first empty chunk, so it usually asks for fewer.
     *
     * @return list<string>
     */
    public function plannedUrls(string $source, string $name): array
    {
        return match ($source) {
            PublishedNames::NPM => [
                self::npmPointUrl('last-month', $name),
                self::npmPointUrl('last-week', $name),
                ...array_map(
                    fn (array $chunk) => self::npmRangeUrl($chunk[0], $chunk[1], $name),
                    $this->npmChunks(),
                ),
            ],
            PublishedNames::PACKAGIST => [self::packagistUrl($name)],
            PublishedNames::PYPI => [self::pypiUrl($name)],
            default => [],
        };
    }

    /** @return array{daily: ?int, weekly: ?int, monthly: ?int, total: ?int} */
    private function npm(string $name): array
    {
        $monthly = self::int($this->get(self::npmPointUrl('last-month', $name)), 'downloads');
        $weekly = self::int($this->get(self::npmPointUrl('last-week', $name)), 'downloads');

        $total = 0;
        foreach ($this->npmChunks() as [$start, $end]) {
            $body = $this->get(self::npmRangeUrl($start, $end, $name));
            $days = $body['downloads'] ?? null;
            if (! is_array($days)) {
                throw new RuntimeException('npm range payload has no downloads array');
            }
            $chunk = array_sum(array_map(fn ($d) => is_array($d) ? (int) ($d['downloads'] ?? 0) : 0, $days));
            $total += $chunk;

            // Nothing in this window means nothing before it either: the
            // package did not exist yet. Stop rather than walk back to 2015.
            if ($chunk === 0) {
                break;
            }
        }

        return ['daily' => null, 'weekly' => $weekly, 'monthly' => $monthly, 'total' => $total];
    }

    /** @return array{daily: ?int, weekly: ?int, monthly: ?int, total: ?int} */
    private function packagist(string $name): array
    {
        $downloads = $this->get(self::packagistUrl($name))['package']['downloads'] ?? null;
        if (! is_array($downloads)) {
            throw new RuntimeException('Packagist payload has no package.downloads');
        }

        return [
            'daily' => self::int($downloads, 'daily'),
            'weekly' => null,
            'monthly' => self::int($downloads, 'monthly'),
            'total' => self::int($downloads, 'total'),
        ];
    }

    /** @return array{daily: ?int, weekly: ?int, monthly: ?int, total: ?int} */
    private function pypi(string $name): array
    {
        $data = $this->get(self::pypiUrl($name))['data'] ?? null;
        if (! is_array($data)) {
            throw new RuntimeException('pypistats payload has no data');
        }

        return [
            'daily' => self::int($data, 'last_day'),
            'weekly' => self::int($data, 'last_week'),
            'monthly' => self::int($data, 'last_month'),
            'total' => null, // pypistats only keeps recent history
        ];
    }

    /**
     * Newest first: [start, end] pairs, each at most 18 months, ending today
     * and reaching back no further than `npm.history_start`.
     *
     * @return list<array{0: string, 1: string}>
     */
    private function npmChunks(): array
    {
        $months = max(1, min(self::NPM_MAX_CHUNK_MONTHS, (int) config('package-downloads.npm.chunk_months', 18)));
        $floor = Carbon::parse((string) config('package-downloads.npm.history_start', '2015-01-10'))->startOfDay();

        $chunks = [];
        $end = Carbon::today();
        while ($end->greaterThanOrEqualTo($floor)) {
            $start = $end->copy()->subMonthsNoOverflow($months)->addDay();
            if ($start->lessThan($floor)) {
                $start = $floor->copy();
            }
            $chunks[] = [$start->toDateString(), $end->toDateString()];
            $end = $start->copy()->subDay();
        }

        return $chunks;
    }

    /**
     * One paced, time-limited GET. A non-2xx is a failure, a 404 included:
     * an unpublished name has no counts, and no counts is not zero.
     *
     * @return array<string, mixed>
     */
    private function get(string $url): array
    {
        if ($this->sentAny) {
            $delay = (int) config('package-downloads.delay_ms', 500);
            if ($delay > 0) {
                Sleep::for($delay)->milliseconds();
            }
        }
        $this->sentAny = true;

        try {
            $response = $this->client()->get($url);
        } catch (ConnectionException $e) {
            throw new RuntimeException("{$url}: ".$e->getMessage(), previous: $e);
        }

        if (! $response->successful()) {
            throw new RuntimeException("{$url}: HTTP {$response->status()}");
        }

        $body = $response->json();
        if (! is_array($body)) {
            throw new RuntimeException("{$url}: response is not JSON");
        }

        return $body;
    }

    private function client(): PendingRequest
    {
        return Http::timeout((int) config('package-downloads.timeout', 15))
            ->connectTimeout((int) config('package-downloads.connect_timeout', 5))
            ->withUserAgent((string) config('package-downloads.user_agent'))
            ->acceptJson();
    }

    /**
     * A count the payload must carry. Missing is an error, never a zero.
     *
     * @param  array<string, mixed>  $body
     */
    private static function int(array $body, string $key): int
    {
        $value = $body[$key] ?? null;
        if (! is_int($value) && ! (is_string($value) && ctype_digit($value))) {
            throw new RuntimeException("payload has no numeric {$key}");
        }

        return (int) $value;
    }

    private static function npmPointUrl(string $period, string $name): string
    {
        return "https://api.npmjs.org/downloads/point/{$period}/{$name}";
    }

    private static function npmRangeUrl(string $start, string $end, string $name): string
    {
        return "https://api.npmjs.org/downloads/range/{$start}:{$end}/{$name}";
    }

    private static function packagistUrl(string $name): string
    {
        return "https://packagist.org/packages/{$name}.json";
    }

    private static function pypiUrl(string $name): string
    {
        return 'https://pypistats.org/api/packages/'.strtolower($name).'/recent';
    }
}
