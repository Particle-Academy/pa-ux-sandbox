<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Setting;

/**
 * The editable well-known-files model (robots / security.txt / humans.txt / …)
 * shared by the admin editor (Admin\AdminWellKnownFilesController +
 *
 * @particle-academy/fancy-x-files-ui's XFilesManager) and the server-side
 * renderer ({@see XFilesFiles}).
 *
 * Plain JSON, mirroring @particle-academy/fancy-x-files-ui's `XFilesModel` so
 * the React editor's value/onChange round-trips straight through. Stored as a
 * Setting; absent ⇒ the {@see default()} built from config/x-files.php, so the
 * served files are identical until an admin saves an edit.
 */
class WellKnownFilesModel
{
    public const SETTING_KEY = 'x_files_model';

    /** The current model — the admin-saved override, else the config default. */
    public static function current(): array
    {
        // Resilient: the x-files provider builds its Registry during boot (to
        // register the routes), which can run before the `settings` table exists
        // (early boot / migrations / a fresh test DB). A failed read just falls
        // back to the config default rather than crashing the whole app.
        try {
            $stored = Setting::get(self::SETTING_KEY);
        } catch (\Throwable) {
            $stored = null;
        }

        if ($stored !== null && $stored !== '') {
            $model = json_decode($stored, true);
            if (is_array($model)) {
                return $model;
            }
        }

        return self::default();
    }

    /**
     * The default model, derived from config/x-files.php: a wildcard group +
     * one permissive group per welcomed AI bot, the protected paths, the
     * sitemap, the security contact, and the humans colophon.
     */
    public static function default(): array
    {
        $base = rtrim((string) config('app.url'), '/');

        $groups = [['userAgents' => ['*'], 'allow' => ['/'], 'disallow' => []]];
        foreach ((array) config('x-files.ai_bots', []) as $bot) {
            $groups[] = ['userAgents' => [$bot], 'allow' => ['/'], 'disallow' => []];
        }

        return [
            'robots' => [
                'groups' => $groups,
                'sitemaps' => [$base.'/sitemap.xml'],
                'protectedPaths' => array_values((array) config('x-files.protect', [])),
            ],
            'securityTxt' => [
                'contact' => [(string) config('x-files.security_contact')],
                'expires' => now()->addYear()->toIso8601String(),
                'preferredLanguages' => 'en',
                'canonical' => $base.'/.well-known/security.txt',
            ],
            'humansTxt' => [
                'team' => [
                    ['role' => 'Team', 'name' => 'Particle Academy'],
                    ['role' => 'Site', 'name' => 'Fancy UI'],
                    ['role' => 'Contact', 'name' => (string) config('x-files.security_contact')],
                ],
                'site' => 'Laravel + Inertia + React 19 + Tailwind v4 + the Fancy UI suite',
                'thanks' => ['Humans and agents who share these surfaces'],
            ],
        ];
    }
}
