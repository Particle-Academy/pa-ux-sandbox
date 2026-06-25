<?php

declare(strict_types=1);

namespace App\Support;

use ParticleAcademy\XFiles\Files\HumansTxt;
use ParticleAcademy\XFiles\Files\RobotsTxt;
use ParticleAcademy\XFiles\Files\SecurityTxt;
use ParticleAcademy\XFiles\Registry;

/**
 * Builds the showcase's well-known files (robots.txt / security.txt / humans.txt)
 * into the x-files {@see Registry} from the editable {@see WellKnownFilesModel}.
 *
 * The model is the admin-saved override (Admin → Well-known files) or, absent
 * one, the config-derived default — so out of the box the output is identical to
 * the old hardcoded build, and an admin edit republishes the served files.
 *
 * This lives in a class — not a closure inside config/x-files.php — because
 * `php artisan config:cache` (run on every deploy) serializes config via
 * var_export, which cannot serialize a Closure. The x-files provider accepts a
 * class-string for `x-files.files` and resolves + invokes it from the container.
 */
class XFilesFiles
{
    public function __invoke(Registry $registry): void
    {
        $model = WellKnownFilesModel::current();

        $this->addRobots($registry, (array) ($model['robots'] ?? []));
        $this->addSecurity($registry, $model['securityTxt'] ?? null);
        $this->addHumans($registry, $model['humansTxt'] ?? null);

        // sitemap.xml — dynamic (auto-discovered URLs from fancy-seo) but served
        // here so protect() applies, with the admin's `sitemapControls` layered
        // on. Rendered lazily, so fancy-seo's providers are registered by then.
        $registry->add(new DynamicSitemap((array) ($model['sitemapControls'] ?? [])));
    }

    /**
     * @param  array<string, mixed>  $robots
     */
    private function addRobots(Registry $registry, array $robots): void
    {
        $r = RobotsTxt::make();

        /** @var list<array<string, mixed>> $groups */
        $groups = $robots['groups'] ?? [['userAgents' => ['*'], 'allow' => ['/']]];
        foreach ($groups as $group) {
            $r->userAgent(array_values(array_filter((array) ($group['userAgents'] ?? ['*']), 'is_string')) ?: ['*']);

            $allow = array_values(array_filter((array) ($group['allow'] ?? []), 'is_string'));
            $disallow = array_values(array_filter((array) ($group['disallow'] ?? []), 'is_string'));
            if ($allow !== []) {
                $r->allow(...$allow);
            }
            if ($disallow !== []) {
                $r->disallow(...$disallow);
            }
            if (isset($group['crawlDelay']) && is_numeric($group['crawlDelay'])) {
                $r->crawlDelay((int) $group['crawlDelay']);
            }
        }

        // SAFETY RAIL: the configured private paths are ALWAYS Disallowed for
        // EVERY group and can never be Allowed — a UI edit can never expose
        // /admin. protect() runs after all groups so it stamps each one (incl.
        // every welcomed AI bot's permissive group). Merged with any
        // model-declared protected paths.
        $protect = array_values(array_unique(array_merge(
            array_values((array) config('x-files.protect', [])),
            array_values(array_filter((array) ($robots['protectedPaths'] ?? []), 'is_string')),
        )));
        if ($protect !== []) {
            $r->protect(...$protect);
        }

        foreach ((array) ($robots['sitemaps'] ?? []) as $sitemap) {
            if (is_string($sitemap) && $sitemap !== '') {
                $r->sitemap($sitemap);
            }
        }
        if (! empty($robots['host']) && is_string($robots['host'])) {
            $r->host($robots['host']);
        }

        $registry->add($r);
    }

    /**
     * @param  array<string, mixed>|null  $security
     */
    private function addSecurity(Registry $registry, ?array $security): void
    {
        $contacts = array_values(array_filter((array) ($security['contact'] ?? []), 'is_string'));
        if ($contacts === []) {
            return;
        }

        $s = SecurityTxt::make()->contact(...$contacts);
        $s->expires(! empty($security['expires']) ? (string) $security['expires'] : now()->addYear()->toDateTimeImmutable());
        if (! empty($security['preferredLanguages'])) {
            $s->preferredLanguage((string) $security['preferredLanguages']);
        }
        if (! empty($security['canonical'])) {
            $s->canonical((string) $security['canonical']);
        }
        if (! empty($security['encryption'])) {
            $s->encryption((string) $security['encryption']);
        }
        if (! empty($security['policy'])) {
            $s->policy((string) $security['policy']);
        }

        $registry->add($s);
    }

    /**
     * @param  array<string, mixed>|null  $humans
     */
    private function addHumans(Registry $registry, ?array $humans): void
    {
        if ($humans === null) {
            return;
        }

        $h = HumansTxt::make();

        /** @var list<array<string, mixed>> $team */
        $team = array_values(array_filter((array) ($humans['team'] ?? []), 'is_array'));
        if ($team !== []) {
            $h->section('TEAM', array_map(static function (array $member): array {
                $value = (string) ($member['name'] ?? '');
                if (! empty($member['contact'])) {
                    $value = trim($value.' · '.$member['contact']);
                }

                return ['label' => (string) ($member['role'] ?? 'Team'), 'value' => $value];
            }, $team));
        }

        if (! empty($humans['site']) && is_string($humans['site'])) {
            $h->section('SITE', [['label' => 'Built with', 'value' => $humans['site']]]);
        }

        $thanks = array_values(array_filter((array) ($humans['thanks'] ?? []), 'is_string'));
        if ($thanks !== []) {
            $h->section('THANKS', array_map(
                static fn (string $t): array => ['label' => 'Thanks', 'value' => $t],
                $thanks,
            ));
        }

        $registry->add($h);
    }
}
