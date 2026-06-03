<?php

namespace App\Support;

use Illuminate\Support\Facades\App;

/**
 * Canonical list of local-only test accounts and the single gate that decides
 * whether the dev quick-login is available.
 *
 * SECURITY: `enabled()` reads the server's resolved environment (APP_ENV) via
 * the framework — it is NOT a request input, header, cookie, or anything a
 * client can influence. The login buttons (rendered server-side in Blade) and
 * the /dev-login endpoint both gate on this, so the feature simply does not
 * exist for a visitor unless the *server* is running in `local`.
 *
 * This is the one source of truth shared by DevUsersSeeder (which creates the
 * accounts) and DevLoginController (which logs them in by an allow-listed
 * email — never an arbitrary user).
 */
class DevAccounts
{
    /**
     * @return list<array{email: string, name: string, is_admin: bool, password: string, label: string}>
     */
    public static function all(): array
    {
        return [
            [
                'email' => 'admin@fancy.test',
                'name' => 'Local Admin',
                'is_admin' => true,
                'password' => 'password',
                'label' => 'Admin',
            ],
            [
                'email' => 'user@fancy.test',
                'name' => 'Local User',
                'is_admin' => false,
                'password' => 'password',
                'label' => 'Regular user',
            ],
        ];
    }

    /**
     * Is the dev quick-login available? True only when the server is running
     * in the `local` environment. Frontend-unreachable by construction.
     */
    public static function enabled(): bool
    {
        return App::environment('local');
    }

    /**
     * The allow-list of emails that /dev-login will authenticate.
     *
     * @return list<string>
     */
    public static function emails(): array
    {
        return array_map(static fn (array $a): string => $a['email'], self::all());
    }
}
