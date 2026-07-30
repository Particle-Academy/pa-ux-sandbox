<?php

namespace App\Http\Middleware;

use App\Services\ActiveUserRecorder;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Records the signed-in user's live presence on real page loads, then
 * broadcasts it on the public `active-users` channel. Runs AFTER the response
 * (like TrackPackageBrowsing) so a slow write never delays the page, and is
 * Cache-throttled to ~1 broadcast / 10s per user so reloads + polling don't
 * flood the channel.
 */
class TrackActiveUser
{
    public function __construct(private readonly ActiveUserRecorder $recorder) {}

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $user = $request->user();
        if ($user === null) {
            return $response;
        }

        // Only coarse, human-facing page loads count as presence: skip
        // non-GET, Inertia partial reloads, and asset/XHR-ish requests.
        if (! $request->isMethod('GET')) {
            return $response;
        }

        if ($request->headers->has('X-Inertia-Partial-Data')) {
            return $response;
        }

        // Only REAL page navigations count as presence — a full HTML page load
        // or an Inertia visit. XHR/fetch data requests must never generate
        // presence: the active-users overlay polls GET /active-users every few
        // seconds, so tracking those would loop back as the user's own activity
        // ("on active-users.index") forever — false hits with no human action.
        $isInertiaVisit = $request->headers->has('X-Inertia');
        $isFullPageLoad = $request->acceptsHtml() && ! $request->headers->has('X-Requested-With');
        if (! $isInertiaVisit && ! $isFullPageLoad) {
            return $response;
        }

        $route = $request->route();
        if ($route === null) {
            return $response;
        }

        // Belt + suspenders: never record the presence/analytics machinery's
        // own routes even if they're hit as a navigation.
        $name = (string) $route->getName();
        if (str_starts_with($name, 'active-users.') || str_starts_with($name, 'heuristics.')) {
            return $response;
        }

        $cacheKey = "active-user:{$user->id}";
        if (Cache::has($cacheKey)) {
            return $response;
        }

        [$type, $label] = $this->describe($request);

        $this->recorder->record(
            user: $user,
            activityType: $type,
            activityLabel: $label,
        );

        Cache::put($cacheKey, true, 10);

        return $response;
    }

    /**
     * Derive a coarse activity_type + human label from the matched route.
     *
     * @return array{0: string, 1: string}
     */
    private function describe(Request $request): array
    {
        $route = $request->route();
        $name = $this->routeName($route?->getName());

        $package = $route?->parameter('package');
        $component = $route?->parameter('component');

        if ($component !== null) {
            return ['component', "exploring {$package}/{$component}"];
        }

        if ($package !== null) {
            return ['package', "viewing the {$package} package"];
        }

        if ($name === null) {
            return ['page', 'browsing '.$this->readablePath($request)];
        }

        return ['page', 'on '.str_replace(['.', '-', '_'], [' ', ' ', ' '], $name)];
    }

    /**
     * A route's name, or null when it genuinely has none.
     *
     * `Route::getName()` does NOT return null for an unnamed route — Laravel's
     * router synthesises `'generated::'.Str::random()`
     * (`AbstractRouteCollection::generateRouteName()`). So `?? 'browsing'` never
     * fired, and the feed published lines like
     * **"Wish Born — on generated::hDAoBhQKlhcWhD3X"**: a random string,
     * different on every request, shown to the user as their own activity.
     */
    private function routeName(?string $name): ?string
    {
        if ($name === null || $name === '' || str_starts_with($name, 'generated::')) {
            return null;
        }

        return $name;
    }

    /**
     * Human-readable fallback for an unnamed route: the URL path.
     *
     * "browsing /docs/starter-kit" beats any internal identifier — the feed is
     * read by people, and a path is what they recognise.
     */
    private function readablePath(Request $request): string
    {
        $path = trim($request->path(), '/');

        return $path === '' ? 'the home page' : '/'.$path;
    }
}
