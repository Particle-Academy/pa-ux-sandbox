<?php

namespace App\Http\Controllers;

use App\Support\DevAccounts;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Show the login form.
     *
     * The dev quick-login accounts are passed to the view ONLY when the server
     * is running in `local`. Outside local this is an empty array, so the
     * buttons are never rendered into the served HTML — there is nothing for a
     * client to toggle on.
     */
    public function showLoginForm()
    {
        return view('auth.login', [
            'devAccounts' => DevAccounts::enabled() ? DevAccounts::all() : [],
        ]);
    }

    /**
     * Handle a login request.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            return redirect()->intended(route('home'));
        }

        throw ValidationException::withMessages([
            'email' => __('The provided credentials do not match our records.'),
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
