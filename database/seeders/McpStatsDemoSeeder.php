<?php

namespace Database\Seeders;

use App\Models\McpRequest;
use App\Models\McpSession;
use App\Support\McpStats\McpRollup;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Thirty days of plausible MCP traffic for looking at /admin/mcp locally:
 * several clients and versions, searches that hit and miss, lookups for slugs
 * that do not exist, a few JSON-RPC errors. Then rolls the days up.
 *
 * Local only; refuses to run in production. Not part of DatabaseSeeder.
 *
 *   php artisan db:seed --class=McpStatsDemoSeeder
 */
class McpStatsDemoSeeder extends Seeder
{
    /** @var array<int, array{0: string, 1: list<string>}> */
    private const CLIENTS = [
        ['claude-code', ['2.0.14', '2.1.0']],
        ['cursor', ['1.7.3']],
        ['codex', ['0.9.1', '0.10.0']],
        ['vscode', ['1.105.0']],
        ['windsurf', ['1.12.2']],
    ];

    private const QUERIES_HIT = ['calendar', 'data grid', 'modal', 'kanban', 'chart', 'date picker', 'table', 'tabs', 'whiteboard', 'spreadsheet'];

    private const QUERIES_MISS = ['gantt chart', 'video editor', 'org chart', 'signature pad', 'hologram', 'timeline scrubber'];

    private const SLUGS_HIT = ['calendar', 'data-table', 'modal', 'kanban', 'date-picker', 'tabs'];

    private const SLUGS_MISS = ['gantt', 'org-chart', 'signature-pad'];

    /**
     * Where demo sessions come from, as Cloudflare would report it: most with
     * a city and 1-decimal coordinates, some with only a country, one with
     * nothing (no Cloudflare in front).
     *
     * @var list<array{country: string|null, city: string|null, latitude: float|null, longitude: float|null}>
     */
    private const PLACES = [
        ['country' => 'US', 'city' => 'San Francisco', 'latitude' => 37.8, 'longitude' => -122.4],
        ['country' => 'US', 'city' => 'New York', 'latitude' => 40.7, 'longitude' => -74.0],
        ['country' => 'US', 'city' => 'Austin', 'latitude' => 30.3, 'longitude' => -97.7],
        ['country' => 'GB', 'city' => 'London', 'latitude' => 51.5, 'longitude' => -0.1],
        ['country' => 'DE', 'city' => 'Berlin', 'latitude' => 52.5, 'longitude' => 13.4],
        ['country' => 'IN', 'city' => 'Bengaluru', 'latitude' => 13.0, 'longitude' => 77.6],
        ['country' => 'JP', 'city' => 'Tokyo', 'latitude' => 35.7, 'longitude' => 139.7],
        ['country' => 'BR', 'city' => 'São Paulo', 'latitude' => -23.6, 'longitude' => -46.6],
        ['country' => 'AU', 'city' => 'Sydney', 'latitude' => -33.9, 'longitude' => 151.2],
        ['country' => 'FR', 'city' => null, 'latitude' => null, 'longitude' => null],
        ['country' => 'CA', 'city' => null, 'latitude' => null, 'longitude' => null],
        ['country' => 'NG', 'city' => null, 'latitude' => null, 'longitude' => null],
        ['country' => null, 'city' => null, 'latitude' => null, 'longitude' => null],
    ];

    public function run(): void
    {
        if (app()->isProduction()) {
            throw new RuntimeException('McpStatsDemoSeeder writes fake analytics and never runs in production.');
        }

        mt_srand(17);

        for ($daysAgo = 29; $daysAgo >= 0; $daysAgo--) {
            $day = now()->startOfDay()->subDays($daysAgo);
            $sessions = mt_rand(3, 9) + (int) ((29 - $daysAgo) / 4);

            for ($s = 0; $s < $sessions; $s++) {
                [$client, $versions] = self::CLIENTS[mt_rand(0, count(self::CLIENTS) - 1)];
                $version = $versions[mt_rand(0, count($versions) - 1)];
                $start = $day->copy()->addSeconds(mt_rand(0, 86000));
                $this->session($client, $version, $start);
            }
        }

        $rollup = app(McpRollup::class);
        for ($daysAgo = 29; $daysAgo >= 0; $daysAgo--) {
            $rollup->rollDay(now()->startOfDay()->subDays($daysAgo));
        }
    }

    private function session(string $client, string $version, Carbon $start): void
    {
        $id = (string) Str::uuid();
        $at = $start->copy();
        $ip = hash('sha256', 'demo-'.mt_rand(1, 40).'-'.$start->toDateString());

        McpSession::query()->create([
            'session_id' => $id,
            'client_name' => $client,
            'client_version' => $version,
            'protocol_version' => '2025-06-18',
            'ua_family' => $client === 'vscode' ? 'node' : $client,
            'ip_hash' => $ip,
            'request_count' => 0,
            'error_count' => 0,
            'first_seen_at' => $at,
            'last_seen_at' => $at,
        ]);

        $base = [
            'day' => $start->toDateString(),
            'session_id' => $id,
            'client_name' => $client,
            'client_version' => $version,
            'protocol_version' => '2025-06-18',
            'ua_family' => $client === 'vscode' ? 'node' : $client,
            'ip_hash' => $ip,
        ] + self::PLACES[mt_rand(0, count(self::PLACES) - 1)];

        $rows = [['method' => 'initialize', 'latency_ms' => mt_rand(3, 15)], ['method' => 'tools/list', 'result_count' => 19, 'latency_ms' => mt_rand(4, 20)]];

        for ($i = 0, $calls = mt_rand(2, 9); $i < $calls; $i++) {
            $rows[] = $this->randomCall();
        }
        if (mt_rand(1, 25) === 1) {
            $rows[] = ['method' => 'resources/list', 'status' => 'error', 'error_code' => -32601, 'error_message' => 'The method [resources/list] was not found.', 'latency_ms' => 2];
        }

        $errors = 0;
        foreach ($rows as $index => $row) {
            $at->addSeconds(mt_rand(1, 40));
            $errors += in_array($row['status'] ?? 'ok', McpRequest::ERROR_STATUSES, true) ? 1 : 0;
            McpRequest::query()->create($base + $row + [
                'jsonrpc_id' => (string) ($index + 1),
                'status' => 'ok',
                'http_status' => 200,
                'created_at' => $at->copy(),
            ]);
        }

        McpSession::query()->where('session_id', $id)->update([
            'request_count' => count($rows),
            'error_count' => $errors,
            'last_seen_at' => $at,
        ]);
    }

    /** @return array<string, mixed> */
    private function randomCall(): array
    {
        $roll = mt_rand(1, 100);

        if ($roll <= 35) {
            $miss = mt_rand(1, 5) === 1;
            $query = $miss ? self::QUERIES_MISS[mt_rand(0, count(self::QUERIES_MISS) - 1)] : self::QUERIES_HIT[mt_rand(0, count(self::QUERIES_HIT) - 1)];

            return $this->tool('search-components', ['query' => $query], ['result_count' => $miss ? 0 : mt_rand(1, 8), 'latency_ms' => mt_rand(8, 60)]);
        }
        if ($roll <= 50) {
            $miss = mt_rand(1, 6) === 1;
            $slug = $miss ? self::SLUGS_MISS[mt_rand(0, count(self::SLUGS_MISS) - 1)] : self::SLUGS_HIT[mt_rand(0, count(self::SLUGS_HIT) - 1)];

            return $this->tool('get-component', ['name' => $slug], $miss
                ? ['status' => 'tool_error', 'error_message' => "Component '{$slug}' not found in the registry. Use `search_components` or `list_components` to discover valid slugs.", 'latency_ms' => mt_rand(5, 20)]
                : ['latency_ms' => mt_rand(40, 400)]);
        }
        if ($roll <= 62) {
            return $this->tool('install-instructions', ['name' => self::SLUGS_HIT[mt_rand(0, count(self::SLUGS_HIT) - 1)]], ['latency_ms' => mt_rand(10, 50)]);
        }
        if ($roll <= 72) {
            $miss = mt_rand(1, 3) === 1;

            return $this->tool('search-nodes', ['query' => $miss ? 'fax machine' : 'upload to s3'], ['result_count' => $miss ? 0 : mt_rand(1, 4), 'latency_ms' => mt_rand(10, 80)]);
        }
        if ($roll <= 82) {
            return $this->tool('list-components', [], ['result_count' => 380, 'latency_ms' => mt_rand(30, 180)]);
        }
        if ($roll <= 90) {
            return $this->tool('start-project', ['backend' => ['php', 'node', 'python'][mt_rand(0, 2)]], ['latency_ms' => mt_rand(5, 30)]);
        }
        if ($roll <= 96) {
            return $this->tool('check-versions', ['lang' => 'node'], ['latency_ms' => mt_rand(200, 2500)]);
        }

        return $this->tool('typography-guide', ['topic' => 'policy'], ['latency_ms' => mt_rand(3, 12)]);
    }

    /**
     * @param  array<string, mixed>  $arguments
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    private function tool(string $name, array $arguments, array $extra): array
    {
        return ['method' => 'tools/call', 'target' => $name, 'arguments' => json_encode((object) $arguments)] + $extra;
    }
}
