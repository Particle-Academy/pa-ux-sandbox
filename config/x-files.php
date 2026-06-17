<?php

declare(strict_types=1);

use ParticleAcademy\XFiles\Files\HumansTxt;
use ParticleAcademy\XFiles\Files\RobotsTxt;
use ParticleAcademy\XFiles\Files\SecurityTxt;
use ParticleAcademy\XFiles\Registry;

return [

    /*
    |--------------------------------------------------------------------------
    | Enable
    |--------------------------------------------------------------------------
    | Master switch. When false, the package registers no routes.
    */
    'enabled' => true,

    /*
    |--------------------------------------------------------------------------
    | Cache (seconds)
    |--------------------------------------------------------------------------
    | Cache-Control max-age applied to every served well-known file. 0 disables.
    */
    'cache' => 3600,

    /*
    |--------------------------------------------------------------------------
    | robots.txt source of truth
    |--------------------------------------------------------------------------
    | x-files now OWNS robots/security/humans (fancy-seo's own routes for these
    | are disabled — see config/fancy-seo.php). fancy-seo still owns the dynamic
    | sitemap.xml + llms.txt / llms-full.txt.
    |
    | `protect` — private / transactional surfaces no bot (incl. the welcomed AI
    | crawlers AND our own screenshot scraper) may crawl. These are passed to
    | RobotsTxt::protect() so they are Disallowed for EVERY group and can NEVER
    | leak back into an Allow for a single bot (the bug this migration fixes).
    |
    | `ai_bots` — AI/LLM user-agents we explicitly welcome (we WANT to be ingested
    | + cited). Each gets its own permissive group, yet protect() still keeps the
    | private paths Disallowed for them too.
    */
    'protect' => ['/admin', '/auth', '/login', '/logout', '/profile', '/dev-login', '/subscriptions', '/checkout'],

    'ai_bots' => [
        'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web',
        'anthropic-ai', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended',
        'CCBot', 'Bytespider', 'Amazonbot', 'Meta-ExternalAgent', 'cohere-ai',
    ],

    /*
    |--------------------------------------------------------------------------
    | security.txt (RFC 9116)
    |--------------------------------------------------------------------------
    */
    'security_contact' => env('FANCY_SEO_SECURITY_CONTACT', 'mailto:glenn@impactivism.net'),

    /*
    |--------------------------------------------------------------------------
    | Files
    |--------------------------------------------------------------------------
    | The callback receives a Registry and registers a WellKnownFile per path.
    */
    'files' => static function (Registry $registry): void {
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
    },

];
