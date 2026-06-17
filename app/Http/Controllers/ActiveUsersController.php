<?php

namespace App\Http\Controllers;

use App\Http\Resources\ActiveUserResource;
use App\Jobs\SimulateActiveUsers;
use App\Models\ActiveUser;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ActiveUsersController extends Controller
{
    /**
     * The REST seed for the live feed — the recently-active roster the
     * frontend hydrates with before subscribing to the `active-users` channel.
     */
    public function index(): AnonymousResourceCollection
    {
        return ActiveUserResource::collection(
            ActiveUser::query()
                ->where(function ($q): void {
                    // Real users linger for 15 minutes of presence...
                    $q->where('is_fake', false)
                        ->where('last_active_at', '>=', now()->subMinutes(15));
                })
                ->orWhere(function ($q): void {
                    // ...but a simulated burst gets a short demo window so it
                    // streams in once and clears itself, instead of being
                    // re-served (and re-animated) on every poll for 15 minutes.
                    $q->where('is_fake', true)
                        ->where('last_active_at', '>=', now()->subSeconds(25));
                })
                ->orderByDesc('activity_at')
                ->limit(50)
                ->get(),
        );
    }

    /**
     * Kick off the staggered fake-presence stream for the showcase demo.
     */
    public function simulate(Request $request): Response
    {
        // Housekeeping: drop stale fake rows from earlier bursts so the table
        // doesn't accumulate demo presence over time.
        ActiveUser::query()
            ->where('is_fake', true)
            ->where('last_active_at', '<', now()->subMinutes(5))
            ->delete();

        // Synchronous so it works without a queue worker — seeds the fakes
        // immediately; the frontend polls them up and staggers the animation.
        SimulateActiveUsers::dispatchSync(0, (int) $request->integer('count', 10));

        return response()->noContent();
    }
}
