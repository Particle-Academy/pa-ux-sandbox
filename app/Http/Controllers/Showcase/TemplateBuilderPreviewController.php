<?php

declare(strict_types=1);

namespace App\Http\Controllers\Showcase;

use App\Http\Requests\Showcase\TemplatePreviewRequest;
use FancyTemplate\Template;
use FancyTemplate\TemplateError;
use FinePrint\Agent;
use FinePrint\Laravel\PageSource;
use FinePrint\Render\Renderer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * The exact preview behind /packages/fancy-template-ui/template-builder, as the
 * package's AGENTS.md tells a Laravel host to build it: fancy-template renders,
 * fine-print writes, and fine-print's own renderer draws the pages (served by
 * fine-print's PageImages route, registered in AppServiceProvider). The preview
 * is therefore the PDF itself, page for page.
 *
 * Safe on a public showcase: the input is bounded by a Form Request, the routes
 * are throttled, the only thing kept is the written PDF for ten minutes, keyed
 * to the visitor's session, and a refusal carries fancy-template's code and
 * JSON Pointer, never a data value.
 */
final class TemplateBuilderPreviewController
{
    public const TTL_SECONDS = 600;

    public function store(TemplatePreviewRequest $request): JsonResponse
    {
        try {
            $document = Template::render($request->template(), $request->renderData());
        } catch (TemplateError $e) {
            return response()->json(['code' => $e->errorCode, 'path' => $e->path], 422);
        }

        $errors = Agent::validate($document);
        if ($errors !== []) {
            return response()->json(['code' => 'FINE_PRINT_INVALID', 'path' => (string) ($errors[0]['path'] ?? '')], 422);
        }

        $bytes = Agent::toBytes($document);
        $key = hash('sha256', $bytes);
        Cache::put(self::cacheKey((string) $request->session()->getId(), $key), $bytes, self::TTL_SECONDS);
        $first = Renderer::render($bytes, 1, 0.25);

        return response()->json([
            'key' => $key,
            'count' => Agent::pageCount($bytes),
            'aspect' => $first->width / max(1, $first->height),
        ]);
    }

    /** fine-print's PageImages resolver: the bytes this session previewed under that key, else nothing. */
    public static function resolve(Request $request, string $file): ?PageSource
    {
        if (preg_match('/^[0-9a-f]{64}$/', $file) !== 1 || ! $request->hasSession()) {
            return null;
        }
        $bytes = Cache::get(self::cacheKey((string) $request->session()->getId(), $file));

        return is_string($bytes) ? new PageSource($bytes, 'tpl-preview:'.$file, 'v1') : null;
    }

    private static function cacheKey(string $session, string $key): string
    {
        return 'tpl-preview:'.hash('sha256', $session).':'.$key;
    }
}
