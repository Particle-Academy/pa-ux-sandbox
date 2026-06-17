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
                ->where('last_active_at', '>=', now()->subMinutes(15))
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
        // Synchronous so it works without a queue worker — seeds the fakes
        // immediately; the frontend polls them up and staggers the animation.
        SimulateActiveUsers::dispatchSync(0, (int) $request->integer('count', 10));

        return response()->noContent();
    }
}
