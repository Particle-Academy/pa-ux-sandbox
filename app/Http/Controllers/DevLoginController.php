<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\DevAccounts;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * One-click login for local development only.
 *
 * SECURITY BOUNDARY: this action aborts with 404 unless the *server* is running
 * in `local` (DevAccounts::enabled() → App::environment('local')). That check
 * reads server config, never request data, so a client cannot enable it. The
 * route is additionally only registered off-production in routes/web.php. The
 * target must be one of the fixed DevAccounts emails — you can never log in as
 * an arbitrary user, and no password is involved or exposed.
 */
class DevLoginController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        abort_unless(DevAccounts::enabled(), 404);

        $email = (string) $request->input('email');
        abort_unless(in_array($email, DevAccounts::emails(), true), 404);

        $user = User::where('email', $email)->first();

        if (! $user) {
            return back()->withErrors([
                'email' => "Dev account {$email} not found. Run: php artisan db:seed --class=DevUsersSeeder",
            ]);
        }

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        return redirect()->intended(route('home'));
    }
}
