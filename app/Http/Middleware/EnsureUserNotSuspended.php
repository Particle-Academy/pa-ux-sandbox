<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Hard stop for suspended accounts. Runs on every authenticated web request:
 * if the signed-in user is suspended, log them out, invalidate the session, and
 * bounce to the login screen with a clear message. Admins can never be suspended
 * (gated in AdminUsersController), so this can't lock an operator out.
 */
class EnsureUserNotSuspended
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user !== null && $user->isSuspended()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect('/login')->withErrors([
                'email' => 'Your account has been suspended. Contact support if you believe this is a mistake.',
            ]);
        }

        return $next($request);
    }
}
