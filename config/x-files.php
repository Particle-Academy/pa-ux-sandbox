<?php

declare(strict_types=1);

use App\Support\XFilesFiles;

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
    | An invokable class-string (resolved from the container) that receives a
    | Registry and registers a WellKnownFile per path. A class — NOT a closure —
    | so `php artisan config:cache` can serialize this config on deploy
    | (closures are non-serializable). See App\Support\XFilesFiles.
    */
    'files' => XFilesFiles::class,

];
