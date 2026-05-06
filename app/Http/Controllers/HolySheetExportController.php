<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use HolySheet\Exceptions\SchemaException;
use HolySheet\Laravel\Facades\HolySheet;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sandbox-specific endpoint that powers the fancy-sheets demo's
 * "Export to xlsx" button. Holy Sheet itself doesn't ship an HTTP
 * layer — apps wire their own routes against the facade so they
 * own auth, rate limiting, and error semantics.
 *
 * Pattern any app can copy:
 *   1. Validate / authorize the request as your app sees fit.
 *   2. Call `HolySheet::toBytes($schema)` (or `validate` + `write`).
 *   3. Return whatever response shape your client expects.
 */
final class HolySheetExportController
{
    public function __invoke(Request $request): Response
    {
        $schema = $request->input('schema');
        $filename = $this->safeFilename((string) $request->input('filename', 'workbook.xlsx'));

        if (!is_array($schema)) {
            return response()->json([
                'error' => 'invalid_request',
                'message' => 'Request body must include a "schema" key with the workbook definition.',
            ], 422);
        }

        try {
            $bytes = HolySheet::toBytes($schema);
        } catch (SchemaException $e) {
            return response()->json([
                'error' => 'validation',
                'message' => $e->getMessage(),
                'errors' => $e->getErrors(),
            ], 422);
        }

        return response($bytes, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="'.addslashes($filename).'"',
            'Content-Length' => (string) strlen($bytes),
            'Cache-Control' => 'no-store',
        ]);
    }

    private function safeFilename(string $name): string
    {
        $name = preg_replace('/[\/\\\\?%*:|"<>]/', '_', $name) ?? 'workbook.xlsx';
        if (!str_ends_with(strtolower($name), '.xlsx')) {
            $name .= '.xlsx';
        }
        return $name;
    }
}
