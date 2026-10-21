<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\PackageRegistry;
use App\Support\Registry\RegistrySource;
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
        // `demo` is a COMPONENT SLUG, and the registry is the vocabulary. It
        // was validated as `string|max:80`, which meant the anti-farm throttle
        // key below was chosen by the caller -- so varying it opened unbounded
        // buckets and the hour cooldown bounded nothing. An unknown slug is
        // also meaningless on its own terms: there is no such demo to interact
        // with, so there was never anything to credit.
        //
        // The demo page sends `package/component` (DemoInteractionTracker in
        // Packages/Component.tsx), so that is accepted when it names a real
        // component page -- the same lookup the page itself resolves through.
        // Accepting only bare registry names made every real award a 422 from
        // 2026-08-24 until 2026-10-21.
        $data = $request->validate([
            'demo' => ['required', 'string', 'max:120', function (string $attribute, mixed $value, \Closure $fail): void {
                if (! is_string($value) || ! $this->isKnownDemo($value)) {
                    $fail('The selected demo is invalid.');
                }
            }],
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
     * A demo id is either a component page (`package/component`, what the page
     * sends) or a bare registry item name. Both are closed sets.
     */
    private function isKnownDemo(string $demo): bool
    {
        if (str_contains($demo, '/')) {
            $parts = explode('/', $demo);
            if (count($parts) !== 2) {
                return false;
            }

            [$package, $component] = $parts;
            $pkg = PackageRegistry::find($package);

            return $pkg !== null
                && collect($pkg['components'] ?? [])->contains('slug', $component);
        }

        return in_array($demo, $this->demoSlugs(), true);
    }

    /**
     * Every component slug the registry knows, cached for the request.
     *
     * @return list<string>
     */
    private function demoSlugs(): array
    {
        return array_map(
            static fn ($item): string => $item->name,
            app(RegistrySource::class)->all(),
        );
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
