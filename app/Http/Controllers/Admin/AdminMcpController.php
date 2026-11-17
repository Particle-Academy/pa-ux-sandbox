<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\McpStatsRangeRequest;
use App\Models\McpRequest;
use App\Models\McpSession;
use App\Models\ShowcaseSubmission;
use App\Support\McpStats\McpStatsReport;
use App\Support\McpStats\StatsRange;
use Inertia\Inertia;
use Inertia\Response;

/**
 * MCP usage analytics: how agents use the hosted `fancy-ui` server at /mcp.
 *
 * Every page takes the same range (`?days=7|30` or `?from=&to=`) and carries
 * it into its drill-down links. Numbers come from McpStatsReport, which reads
 * the daily rollups `mcp-stats:rollup` maintains.
 */
class AdminMcpController extends Controller
{
    public function __construct(private readonly McpStatsReport $report) {}

    public function index(McpStatsRangeRequest $request): Response
    {
        $range = $request->range();

        return Inertia::render('Admin/Mcp/Index', $this->report->overview($range) + $this->shared($range));
    }

    public function tool(McpStatsRangeRequest $request, string $tool): Response
    {
        $range = $request->range();

        return Inertia::render('Admin/Mcp/Tool', $this->report->tool($range, $tool) + $this->shared($range));
    }

    public function client(McpStatsRangeRequest $request, string $client): Response
    {
        $range = $request->range();
        $version = $request->query('version');

        return Inertia::render('Admin/Mcp/Client', $this->report->client(
            $range,
            $client,
            is_string($version) && $version !== '' ? $version : null,
        ) + $this->shared($range));
    }

    public function session(McpStatsRangeRequest $request, string $session): Response
    {
        $row = McpSession::query()->where('session_id', $session)->firstOrFail();

        return Inertia::render('Admin/Mcp/Session', $this->report->session($row) + $this->shared($request->range()));
    }

    public function errors(McpStatsRangeRequest $request): Response
    {
        $range = $request->range();

        return Inertia::render('Admin/Mcp/Errors', $this->report->errors($range) + $this->shared($range));
    }

    public function errorCalls(McpStatsRangeRequest $request): Response
    {
        $range = $request->range();
        $status = $request->query('status');
        $code = $request->query('code');
        $filters = [
            'status' => is_string($status) && in_array($status, McpRequest::ERROR_STATUSES, true) ? $status : null,
            'code' => is_string($code) && preg_match('/^-?\d+$/', $code) === 1 ? (int) $code : null,
            'tool' => is_string($request->query('tool')) && $request->query('tool') !== '' ? (string) $request->query('tool') : null,
            'method' => is_string($request->query('method')) && $request->query('method') !== '' ? (string) $request->query('method') : null,
        ];

        return Inertia::render('Admin/Mcp/ErrorCalls', [
            'filters' => $filters,
            'calls' => $this->report->errorCalls($range, $filters),
        ] + $this->shared($range));
    }

    public function searchDemand(McpStatsRangeRequest $request): Response
    {
        $range = $request->range();

        return Inertia::render('Admin/Mcp/SearchDemand', $this->report->searchDemand($range) + $this->shared($range));
    }

    /**
     * The range, and the pending-submissions badge every admin page feeds the
     * shell's Sites nav entry.
     *
     * @return array{range: array<string, mixed>, pending: int}
     */
    private function shared(StatsRange $range): array
    {
        return [
            'range' => $range->toArray(),
            'pending' => (int) ShowcaseSubmission::query()->where('status', 'pending')->count(),
        ];
    }
}
