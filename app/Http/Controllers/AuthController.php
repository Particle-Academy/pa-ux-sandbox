<?php

namespace App\Http\Controllers;

use App\Support\DevAccounts;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    /**
     * Show the sign-in page: one "Continue with GitHub" button.
     *
     * There is deliberately no password login or registration here; GitHub
     * is the only way in (App\Http\Controllers\Auth\GitHubLoginController).
     *
     * The dev quick-login accounts are passed to the view ONLY when the server
     * is running in `local`. Outside local this is an empty array, so the
     * buttons are never rendered into the served HTML — there is nothing for a
     * client to toggle on.
     *
     * The page is Blade, not an Inertia page, so an Inertia visit to it (the
     * /learn enroll button, the shop balance link) gets a full-page location
     * response instead of HTML the client cannot render.
     */
    public function showLoginForm(Request $request): Response
    {
        if ($request->header('X-Inertia')) {
            return Inertia::location(route('login'));
        }

        return response()->view('auth.login', [
            'devAccounts' => DevAccounts::enabled() ? DevAccounts::all() : [],
        ]);
    }

    /**
     * Handle a logout request.
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }
}
