<?php

declare(strict_types=1);

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Http\Requests\Showcase\UpdateSeenNoticesRequest;
use App\Support\Notices\WhatsNewFeed;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * The site's "What's new" notice (fancy-whats-new), dogfooded.
 *
 * `index` answers the component's `load(since)`; `seen` / `updateSeen` are the
 * per-account store fancy-inertia's `createHttpStorage` talks to, so a signed-in
 * person is shown each group once across devices. Guests keep their cursor in
 * localStorage and never call those two.
 */
final class WhatsNewController extends Controller
{
    /** Groups newer than `?since=`, newest first. */
    public function index(Request $request, WhatsNewFeed $feed): JsonResponse
    {
        $since = $request->query('since');

        return response()->json($feed->since(is_string($since) && $since !== '' ? $since : null));
    }

    /** The newest cursor this account has been shown. */
    public function seen(Request $request): JsonResponse
    {
        return response()->json(['seen' => $request->user()->seen_notices]);
    }

    /** Remember the newest cursor this account has been shown. */
    public function updateSeen(UpdateSeenNoticesRequest $request): Response
    {
        $request->user()->forceFill(['seen_notices' => $request->validated('seen')])->save();

        return response()->noContent();
    }
}
