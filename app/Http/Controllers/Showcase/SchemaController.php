<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\File;

/**
 * GET /schema/{name}.json — the JSON Schemas the registry documents name.
 *
 * `/r/index.json`, every `/r/{name}.json`, `/r/nodes/index.json` and every
 * fancy.json fancy-cli writes declare a `$schema` on this origin, and every one
 * of those URLs was a 404: editors reported they could not load it, and a
 * validator that fetches the schema failed before reading the document.
 *
 * The files live in `resources/schema/` and are served byte for byte, so the
 * `$id` inside each one is exactly the URL it came from. They are validated
 * against the real responses in `PublishedSchemasTest`, which is what stops a
 * payload change from quietly leaving its schema behind.
 */
class SchemaController extends Controller
{
    private const HEADERS = [
        'Cache-Control' => 'public, max-age=300, s-maxage=900',
        'Access-Control-Allow-Origin' => '*',
    ];

    public function show(string $name): Response|JsonResponse
    {
        $name = basename($name, '.json');
        $path = resource_path("schema/{$name}.json");

        if (preg_match('/^[a-z0-9-]+$/', $name) !== 1 || ! File::isFile($path)) {
            return response()->json(['error' => "schema '{$name}' not found"], 404, self::HEADERS);
        }

        return response(File::get($path), 200, [
            ...self::HEADERS,
            'Content-Type' => 'application/schema+json',
        ]);
    }
}
