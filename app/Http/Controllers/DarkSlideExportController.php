<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use DarkSlide\Exceptions\SchemaException;
use DarkSlide\Laravel\Facades\DarkSlide;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sandbox-specific endpoint that powers the fancy-slides demo's
 * "Download .pptx" button. dark-slide itself ships no HTTP layer —
 * apps wire their own routes against the facade so they own auth,
 * rate limiting, and error semantics.
 *
 * Same shape as the HolySheetExportController next door.
 *
 * Pattern any app can copy:
 *   1. Validate / authorize the request as your app sees fit.
 *   2. Call `DarkSlide::toBytes($deck)` (or `validate` + `write`).
 *   3. Return whatever response shape your client expects.
 */
final class DarkSlideExportController
{
    public function __invoke(Request $request): Response
    {
        $deck = $request->input('deck');
        $filename = $this->safeFilename((string) $request->input('filename', 'deck.pptx'));

        if (!is_array($deck)) {
            return response()->json([
                'error' => 'invalid_request',
                'message' => 'Request body must include a "deck" key with the deck definition.',
            ], 422);
        }

        try {
            $bytes = DarkSlide::toBytes($deck);
        } catch (SchemaException $e) {
            return response()->json([
                'error' => 'validation',
                'message' => $e->getMessage(),
                'errors' => $e->errors,
            ], 422);
        }

        return response($bytes, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'Content-Disposition' => 'attachment; filename="' . addslashes($filename) . '"',
            'Content-Length' => (string) strlen($bytes),
            'Cache-Control' => 'no-store',
        ]);
    }

    private function safeFilename(string $name): string
    {
        $name = preg_replace('/[\/\\\\?%*:|"<>]/', '_', $name) ?? 'deck.pptx';
        if (!str_ends_with(strtolower($name), '.pptx')) {
            $name .= '.pptx';
        }

        return $name;
    }
}
