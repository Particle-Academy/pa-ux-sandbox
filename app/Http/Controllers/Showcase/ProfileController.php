<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Services\PlayerProfile;
use App\Support\Usernames;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function show(Request $request, PlayerProfile $profiles): Response
    {
        $user = $request->user();

        return Inertia::render('Profile/Show', [
            'profile' => $profiles->full($user),
            // Username settings — powers the /join/{username} referral link.
            'username' => $user->username,
            'usernameSuggestion' => $user->username === null ? Usernames::suggestionFor($user) : null,
        ]);
    }

    /**
     * Claim or change the user's username (lowercase kebab handle, unique
     * case-insensitively, reserved names rejected). Powers /join/{username}.
     */
    public function updateUsername(Request $request): RedirectResponse
    {
        $user = $request->user();
        $request->merge(['username' => Usernames::normalize($request->input('username'))]);

        $data = $request->validate(
            ['username' => Usernames::rules($user)],
            ['username.regex' => 'Usernames are 3–30 characters: lowercase letters, numbers, and dashes, starting with a letter or number.',
                'username.not_in' => 'That username is reserved.'],
        );

        $user->update(['username' => $data['username']]);

        return back()->with('success', "Username set — your referral link is /join/{$data['username']}.");
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
