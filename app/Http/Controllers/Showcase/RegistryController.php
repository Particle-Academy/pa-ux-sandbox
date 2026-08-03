<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Support\Registry\RegistrySource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RegistryController extends Controller
{
    public function __construct(private readonly RegistrySource $source) {}

    /**
     * GET /r/index.json — shadcn-compatible registry index.
     *
     * `?version=0.4` narrows the index to what existed in that kit version, so
     * a consumer on a maintenance line is not offered components added after
     * it — and an agent working in that app is not told about APIs it cannot
     * call. Omitted, the index describes the current kit.
     */
    public function index(Request $request): JsonResponse
    {
        $version = $this->requestedVersion($request);
        $items = $this->source->all();

        if ($version !== null) {
            $items = array_values(array_filter($items, fn ($item): bool => $item->existsIn($version)));
        }

        return response()->json([
            '$schema' => 'https://ui.particle.academy/schema/registry.json',
            'name' => 'fancy-ui',
            'homepage' => 'https://ui.particle.academy',
            'version' => $version ?? config('kit.version'),
            'items' => array_map(fn ($item) => $item->toSummary(), $items),
        ], 200, [
            'Cache-Control' => 'public, max-age=300, s-maxage=900',
            'Access-Control-Allow-Origin' => '*',
            // The payload differs by ?version, so a shared cache must not serve
            // one version's index for another's request.
            'Vary' => 'Accept-Encoding',
        ]);
    }

    /**
     * GET /r/{slug}.json — shadcn-compatible registry-item.
     *
     * `?version=` is honoured here too: asking for an item that did not exist
     * in that version is a 404, not a silent success. The CLI vendors whatever
     * this returns, so answering with source that will not compile against the
     * consumer's kit is worse than answering with nothing.
     */
    public function show(Request $request, string $slug): JsonResponse
    {
        $slug = str_replace('.json', '', $slug);
        $version = $this->requestedVersion($request);

        $item = $this->source->find($slug);
        if (! $item) {
            return response()->json([
                'error' => "registry item '$slug' not found",
            ], 404);
        }

        if ($version !== null && ! $item->existsIn($version)) {
            return response()->json([
                'error' => "registry item '$slug' does not exist in kit version $version",
                'since' => $item->since,
                'until' => $item->until,
            ], 404);
        }

        return response()->json($item->toArray(), 200, [
            'Cache-Control' => 'public, max-age=300, s-maxage=900',
            'Access-Control-Allow-Origin' => '*',
            'Vary' => 'Accept-Encoding',
        ]);
    }

    /**
     * The requested kit version, or null for "current".
     *
     * A malformed value returns null rather than erroring: this is a public,
     * cached endpoint consumed by tooling, and failing a whole install over a
     * junk query string would be a worse outcome than ignoring it.
     */
    private function requestedVersion(Request $request): ?string
    {
        $version = $request->query('version');

        if (! is_string($version) || ! preg_match('/^\d+\.\d+$/', $version)) {
            return null;
        }

        return $version;
    }
}
