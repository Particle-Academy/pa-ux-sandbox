<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use InvalidArgumentException;
use LastWord\Agent as LastWord;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sandbox-specific endpoint that exports a `.docx` from a last-word document.
 *
 * The third of three. `holy-sheet` and `dark-slide` have had an export endpoint
 * and a demo here for a long time; `last-word` had **neither** — it appeared in
 * `PackageRegistry`, in a package family, in a use case and in the curriculum,
 * and a consumer following any of those reached nothing. That is the "wired to
 * nothing" shape in the app whose whole job is to prove the kit works.
 *
 * Pattern any app can copy — identical to its two siblings:
 *   1. Validate / authorize the request as your app sees fit.
 *   2. Call `LastWord\Agent::toBytes($doc)` (or `validate` + `write`).
 *   3. Return whatever response shape your client expects.
 *
 * **It calls the class directly rather than a facade, because there is no
 * facade.** `holy-sheet` and `dark-slide` both ship a `Laravel/` directory with
 * a service provider and facade; `last-word` ships none. Nothing here needs one
 * — the API is static and works exactly as well — but the asymmetry is real, it
 * is why this package was the one nobody wired, and it should be closed in the
 * package rather than papered over here.
 */
final class LastWordExportController
{
    public function __invoke(Request $request): Response
    {
        $doc = $request->input('doc');
        $filename = $this->safeFilename((string) $request->input('filename', 'document.docx'));

        if (! is_array($doc)) {
            return response()->json([
                'error' => 'invalid_request',
                'message' => 'Request body must include a "doc" key with the document definition.',
            ], 422);
        }

        // `validate` before `toBytes` on purpose. Both refuse an invalid
        // document, but only `validate` returns the per-error `path` and
        // `message` an app can put in front of a person — `toBytes` raises a
        // single InvalidArgumentException carrying a summary.
        $errors = LastWord::validate($doc);

        if ($errors !== []) {
            return response()->json([
                'error' => 'validation',
                'message' => 'Document failed schema validation.',
                'errors' => $errors,
            ], 422);
        }

        try {
            $bytes = LastWord::toBytes($doc);
        } catch (InvalidArgumentException $e) {
            // Reached only if the writer refuses something the validator
            // accepted. That is a defect rather than a user error, and it must
            // not be reported as a clean 422 with no errors in it.
            return response()->json([
                'error' => 'write_failed',
                'message' => $e->getMessage(),
            ], 500);
        }

        return response($bytes, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition' => 'attachment; filename="'.addslashes($filename).'"',
            'Content-Length' => (string) strlen($bytes),
            'Cache-Control' => 'no-store',
        ]);
    }

    private function safeFilename(string $name): string
    {
        $name = preg_replace('/[\/\\\\?%*:|"<>]/', '_', $name) ?? 'document.docx';

        if (! str_ends_with(strtolower($name), '.docx')) {
            $name .= '.docx';
        }

        return $name;
    }
}
