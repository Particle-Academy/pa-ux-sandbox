<?php

declare(strict_types=1);

namespace App\Support;

use ParticleAcademy\XFiles\Files\HumansTxt;
use ParticleAcademy\XFiles\Files\RobotsTxt;
use ParticleAcademy\XFiles\Files\SecurityTxt;
use ParticleAcademy\XFiles\Registry;

/**
 * Builds the showcase's well-known files (robots.txt / security.txt / humans.txt)
 * into the x-files {@see Registry}.
 *
 * This lives in a class — not a closure inside config/x-files.php — because
 * `php artisan config:cache` (run on every deploy) serializes config via
 * var_export, which cannot serialize a Closure ("Call to undefined method
 * Closure::__set_state()"). The x-files provider accepts a class-string for
 * `x-files.files` and resolves + invokes it from the container, so config stays
 * pure, serializable data.
 */
class XFilesFiles
{
    public function __invoke(Registry $registry): void
    {
        $base = rtrim((string) config('app.url'), '/');

        // robots.txt — index-friendly, explicitly welcomes each AI bot, and
        // protect()s the private paths so they stay Disallowed for EVERY group
        // (the wildcard group AND every welcomed AI bot) — no per-bot leak.
        $robots = RobotsTxt::make()
            ->userAgent('*')
            ->allowAll();

        /** @var list<string> $aiBots */
        $aiBots = (array) config('x-files.ai_bots', []);
        foreach ($aiBots as $bot) {
            // Each welcomed AI crawler gets its own group, generously allowed `/`.
            $robots->userAgent($bot)->allow('/');
        }

        // protect() runs last so it stamps a Disallow onto every group above
        // (current and future) and refuses to ever Allow these paths.
        /** @var list<string> $protected */
        $protected = (array) config('x-files.protect', []);
        $robots->protect(...$protected)
            ->sitemap($base.'/sitemap.xml');

        $registry->add($robots);

        // security.txt — Contact + a future Expires (required) + en + canonical.
        $registry->add(
            SecurityTxt::make()
                ->contact((string) config('x-files.security_contact'))
                ->expires(now()->addYear()->toDateTimeImmutable())
                ->preferredLanguage('en')
                ->canonical(secure_url('/.well-known/security.txt'))
        );

        // humans.txt — colophon for the showcase.
        $registry->add(
            HumansTxt::make()
                ->section('TEAM', [
                    ['label' => 'Team', 'value' => 'Particle Academy'],
                    ['label' => 'Site', 'value' => 'Fancy UI'],
                    ['label' => 'Contact', 'value' => (string) config('x-files.security_contact')],
                ])
                ->section('THANKS', [
                    ['label' => 'Humans and agents', 'value' => 'who share these surfaces'],
                ])
                ->section('SITE', [
                    ['label' => 'URL', 'value' => $base],
                    ['label' => 'Built with', 'value' => 'Laravel + Inertia + React 19 + Tailwind v4 + the Fancy UI suite'],
                    ['label' => 'Standards', 'value' => 'Human+ UX — humans and agents share the same UI'],
                ])
        );
    }
}
