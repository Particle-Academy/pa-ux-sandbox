<?php

namespace App\Http\Middleware;

use App\Support\XpAwarder;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Awards explorer-xp on /packages/* page loads.
 *
 * Throttled per (user, route, package, component) for 24h so reloads
 * and tab-switching don't farm XP. Award fires AFTER the response so a
 * slow LFL write never delays the page.
 */
class TrackPackageBrowsing
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $user = $request->user();
        if ($user === null) {
            return $response;
        }

        $route = $request->route();
        if ($route === null) {
            return $response;
        }

        $package = (string) $route->parameter('package', 'index');
        $component = (string) $route->parameter('component', '');
        $key = $component !== '' ? "component:{$package}/{$component}" : "package:{$package}";

        // Component pages reward more than index/list views — that's
        // where the actual learning happens.
        $amount = $component !== '' ? 4 : ($package === 'index' ? 2 : 3);

        XpAwarder::award(
            user: $user,
            metric: 'explorer-xp',
            amount: $amount,
            reason: "viewed {$key}",
            throttleKey: $key,
            throttleSeconds: 86400,
        );

        return $response;
    }
}
