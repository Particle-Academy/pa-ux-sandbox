<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\XpAwarder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Endpoints the front-end pings to credit demo interactions + agent
 * bridge invocations as XP.
 *
 * Both endpoints sit behind `auth` middleware in routes/web.php — guests
 * silently no-op via XpAwarder, but the route check is the first wall
 * so we don't waste a request cycle.
 */
class XpController extends Controller
{
    /**
     * POST /api/xp/demo
     *
     * Awarded by the JS demos when a user actually interacts with the
     * component (paints a grid cell, drags a slide, executes a flow,
     * etc.) — NOT on mount. Throttled per (user, demo, kind) for 1h so
     * a chatty demo can't farm.
     */
    public function demo(Request $request): JsonResponse
    {
        $data = $request->validate([
            'demo' => 'required|string|max:80',
            'kind' => 'sometimes|string|in:interaction,first-use,completion',
        ]);

        $kind = $data['kind'] ?? 'interaction';
        $amount = match ($kind) {
            'first-use' => 15,
            'completion' => 25,
            default => 3,
        };

        $awarded = XpAwarder::award(
            user: $request->user(),
            metric: 'tinkerer-xp',
            amount: $amount,
            reason: "{$kind} on demo {$data['demo']}",
            throttleKey: "{$data['demo']}:{$kind}",
            throttleSeconds: 3600,
        );

        return response()->json(['awarded' => $awarded, 'amount' => $awarded ? $amount : 0]);
    }

    /**
     * POST /api/xp/bridge
     *
     * Awarded when an MCP bridge tool is invoked in the user's session.
     * Tracks each unique tool once per hour so agentic loops (which may
     * call the same tool many times in quick succession) don't farm.
     */
    public function bridge(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tool' => 'required|string|max:120',
            'bridge' => 'sometimes|string|max:40',
        ]);

        $bridge = $data['bridge'] ?? 'unknown';

        $awarded = XpAwarder::award(
            user: $request->user(),
            metric: 'bridge-xp',
            amount: 5,
            reason: "invoked {$bridge}::{$data['tool']}",
            throttleKey: "tool:{$data['tool']}",
            throttleSeconds: 3600,
        );

        return response()->json(['awarded' => $awarded, 'amount' => $awarded ? 5 : 0]);
    }
}
