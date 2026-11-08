<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Support\Radio\RadioTracks;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * One showcase radio track as audio/mpeg.
 *
 * A BinaryFileResponse answers HTTP Range requests itself (206 Partial
 * Content with Content-Range), which is what
 * lets the player seek without downloading the whole file first. The files
 * do not change once committed, so they cache for a day and revalidate by
 * Last-Modified / ETag after that.
 */
class RadioAudioController extends Controller
{
    public function __invoke(string $track): BinaryFileResponse
    {
        $path = RadioTracks::path($track);
        abort_if($path === null, 404);

        $response = new BinaryFileResponse($path, 200, [
            'Content-Type' => 'audio/mpeg',
            'Cache-Control' => 'public, max-age=86400',
        ], true, null, true, true);
        $response->headers->set('Accept-Ranges', 'bytes');

        return $response;
    }
}
