<?php

declare(strict_types=1);

namespace App\Support;

use FancySeo\Facades\FancySeo;
use ParticleAcademy\XFiles\Contracts\WellKnownFile;
use ParticleAcademy\XFiles\Files\Sitemap;

/**
 * sitemap.xml — built DYNAMICALLY from fancy-seo's registered URL providers
 * (every top-level page + package + component) and served through
 * fancy-x-files, so the same protect() leak-guard that governs robots.txt also
 * governs the sitemap: a private path in config('x-files.protect') can NEVER be
 * listed here (the gap the old fancy-seo-owned sitemap had).
 *
 * It stays dynamic, but the admin well-known-files model can layer controls on
 * top via its `sitemapControls` section:
 *   exclude   — list<string> paths to drop from the auto-discovered set
 *   overrides — map<path, {priority?, changefreq?}> per-URL tuning
 *   extra     — list<{loc, priority?, changefreq?}> manually-added URLs
 *
 * Rendered LAZILY (render() at request time) so it does not matter whether the
 * x-files Registry is built before or after SeoServiceProvider registers its
 * sitemap providers during boot — by the time a request hits, both have run.
 */
final class DynamicSitemap implements WellKnownFile
{
    /** @param  array<string, mixed>  $controls  the admin model's `sitemap` section */
    public function __construct(private readonly array $controls = []) {}

    public function path(): string
    {
        // Leading slash to match the x-files Registry convention (/robots.txt,
        // /humans.txt, …) — ServeWellKnownFile looks the file up by this key.
        return '/sitemap.xml';
    }

    public function contentType(): string
    {
        return 'application/xml; charset=utf-8';
    }

    public function render(): string
    {
        $sitemap = Sitemap::make();

        $protect = array_values((array) config('x-files.protect', []));
        $exclude = array_values(array_filter((array) ($this->controls['exclude'] ?? []), 'is_string'));
        /** @var array<string, array<string, mixed>> $overrides */
        $overrides = (array) ($this->controls['overrides'] ?? []);

        foreach (FancySeo::sitemapUrls() as $url) {
            $path = parse_url((string) $url['loc'], PHP_URL_PATH) ?: '/';

            // Leak-guard + admin exclusions: a protected/excluded path is never listed.
            if ($this->matchesAny($path, $protect) || $this->matchesAny($path, $exclude)) {
                continue;
            }

            $override = is_array($overrides[$path] ?? null) ? $overrides[$path] : [];
            $sitemap->url(
                (string) $url['loc'],
                $url['lastmod'] ?? null,
                isset($override['changefreq']) ? (string) $override['changefreq'] : ($url['changefreq'] ?? null),
                isset($override['priority']) ? (string) $override['priority'] : ($url['priority'] ?? null),
            );
        }

        // Admin-added extra URLs (not auto-discovered).
        foreach ((array) ($this->controls['extra'] ?? []) as $extra) {
            if (is_array($extra) && ! empty($extra['loc'])) {
                $sitemap->url(
                    (string) $extra['loc'],
                    null,
                    isset($extra['changefreq']) ? (string) $extra['changefreq'] : null,
                    isset($extra['priority']) ? (string) $extra['priority'] : null,
                );
            }
        }

        return $sitemap->render();
    }

    /** @return list<string> */
    public function validate(): array
    {
        return [];
    }

    /** @param  list<string>  $patterns */
    private function matchesAny(string $path, array $patterns): bool
    {
        foreach ($patterns as $pattern) {
            $prefix = rtrim((string) $pattern, '/');
            if ($prefix !== '' && ($path === $prefix || str_starts_with($path, $prefix.'/'))) {
                return true;
            }
        }

        return false;
    }
}
