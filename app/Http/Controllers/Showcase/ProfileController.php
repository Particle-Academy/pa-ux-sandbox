<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Services\PlayerProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function show(Request $request, PlayerProfile $profiles): Response
    {
        return Inertia::render('Profile/Show', [
            'profile' => $profiles->full($request->user()),
        ]);
    }

    /**
     * Let a player opt in/out of the gamification layer from their profile.
     */
    public function toggleOptOut(Request $request): RedirectResponse
    {
        $user = $request->user();
        if ($user->isOptedOut()) {
            $user->optIn();
            $msg = 'You\'re back in — XP and coins will accrue again.';
        } else {
            $user->optOut();
            $msg = 'Opted out. You won\'t earn XP/coins or appear on player leaderboards.';
        }

        return back()->with('success', $msg);
    }
}
