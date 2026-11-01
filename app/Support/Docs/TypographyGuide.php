<?php

namespace App\Support\Docs;

use Illuminate\Support\Facades\File;
use RuntimeException;

/**
 * The typography guide, read from ONE file: resources/docs/typography.md.
 *
 * That file is the /docs/typography page as written, and it is also what the
 * `typography-guide` MCP tool returns, split into topics. Each section starts
 * with a `<!-- topic: <id> -->` marker on its own line, followed by its `##`
 * heading. A second copy of the content inside the tool would drift from the
 * page the first time either was edited, so the tool never holds prose.
 */
class TypographyGuide
{
    public const SLUG = 'typography';

    public const URL = 'https://ui.particle.academy/docs/typography';

    public static function path(): string
    {
        return resource_path('docs/'.self::SLUG.'.md');
    }

    public static function markdown(): string
    {
        return File::get(self::path());
    }

    /**
     * The guide's sections, in page order, keyed by topic id.
     *
     * @return array<string, array{topic: string, title: string, markdown: string}>
     */
    public static function sections(): array
    {
        $parts = preg_split('/^<!--\s*topic:\s*([a-z0-9-]+)\s*-->\s*$/m', self::markdown(), -1, PREG_SPLIT_DELIM_CAPTURE);

        if ($parts === false || count($parts) < 3) {
            throw new RuntimeException('resources/docs/typography.md has no <!-- topic: … --> markers; the typography-guide tool would serve nothing.');
        }

        $sections = [];

        for ($i = 1; $i < count($parts); $i += 2) {
            $topic = $parts[$i];
            $body = trim($parts[$i + 1] ?? '');
            $title = preg_match('/^##\s+(.+)$/m', $body, $match) === 1 ? trim($match[1]) : $topic;

            $sections[$topic] = ['topic' => $topic, 'title' => $title, 'markdown' => $body];
        }

        return $sections;
    }

    /** @return list<string> */
    public static function topics(): array
    {
        return array_keys(self::sections());
    }

    /**
     * Map a loosely spelled topic ("Google Fonts", "google_fonts") to its id.
     * Returns null when nothing matches.
     */
    public static function normalizeTopic(string $raw): ?string
    {
        $slug = trim((string) preg_replace('/[^a-z0-9]+/', '-', strtolower(trim($raw))), '-');

        $aliases = [
            'google' => 'google-fonts',
            'googlefonts' => 'google-fonts',
            'custom-font' => 'custom',
            'custom-fonts' => 'custom',
            'web-font' => 'custom',
            'web-fonts' => 'custom',
            'license' => 'licensing',
            'licence' => 'licensing',
            'licenses' => 'licensing',
            'licences' => 'licensing',
            'default' => 'defaults',
            'determinism' => 'deterministic',
            'package' => 'packages',
        ];

        $slug = $aliases[$slug] ?? $slug;

        return in_array($slug, self::topics(), true) ? $slug : null;
    }
}
