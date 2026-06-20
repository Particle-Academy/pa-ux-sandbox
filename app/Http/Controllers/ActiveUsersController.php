<?php

namespace App\Http\Controllers;

use App\Http\Resources\ActiveUserResource;
use App\Models\ActiveUser;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

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
                ->where('is_fake', false)
                ->where('last_active_at', '>=', now()->subMinutes(15))
                ->orderByDesc('activity_at')
                ->limit(50)
                ->get(),
        );
    }
}
