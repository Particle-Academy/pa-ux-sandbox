<?php

declare(strict_types=1);

namespace Tests\Feature\Packages;

use App\Support\PackageRegistry;
use Tests\TestCase;

/**
 * Every published Prism package is listed here.
 *
 * ## Why this is a test and why it names the packages
 *
 * The registry already carried a comment saying the rest of the Prism family
 * had been absent, so `prism` "was the only one an agent could find -- which
 * reads as 'that is all there is', not as 'the others are undiscoverable'".
 *
 * Then three more shipped — `prism-workspace`, `prism-memory`,
 * `prism-browser` — and were not added. **The same failure recurred against a
 * note describing it**, which is the argument for a check rather than a
 * paragraph: prose adjacent to a rule is not the rule.
 *
 * The cost is measured, not hypothetical. An agent in another workspace
 * searched the Fancy MCP for an LLM harness, a browser package and a Human+
 * package, found nothing usable, and proposed a THIRD-PARTY library — which its
 * owner then had to reject. An absence here does not read as "look elsewhere in
 * Fancy"; it reads as "Fancy does not have this", and somebody adds a
 * dependency on the strength of it.
 *
 * ## Why the list is hardcoded rather than fetched
 *
 * Asking Packagist would make this test a network call that goes red when
 * Packagist is slow, and a check that fails for unrelated reasons gets muted.
 * The list is the point of review: adding a Prism package means adding it here
 * in the same change, and THAT is the moment someone remembers the registry.
 *
 * If a tenth ships and this test still passes, this test is the thing that is
 * wrong.
 */
final class PrismFamilyIsCompleteTest extends TestCase
{
    /**
     * Every `particle-academy/prism*` package published on Packagist as of
     * 2026-09-12, verified against the Packagist search API on that date.
     */
    private const PUBLISHED = [
        'prism',
        'prism-harness',
        'prism-human-plus',
        'prism-mcp',
        'prism-opentelemetry',
        'prism-perplexity',
        'prism-workspace',
        'prism-memory',
        'prism-browser',
    ];

    public function test_every_published_prism_package_is_registered(): void
    {
        $known = array_column(PackageRegistry::everything(), 'slug');

        foreach (self::PUBLISHED as $slug) {
            $this->assertContains(
                $slug,
                $known,
                "particle-academy/{$slug} is published but not in PackageRegistry, so the MCP, /packages "
                .'and kit:status all report it as not existing. That is how a consumer ends up adding a '
                .'third-party dependency for something we ship.',
            );
        }
    }

    /** A registered package with no tagline is a row nobody can act on. */
    public function test_each_one_says_what_it_is_for(): void
    {
        $byslug = [];

        foreach (PackageRegistry::everything() as $definition) {
            $byslug[$definition['slug']] = $definition;
        }

        foreach (self::PUBLISHED as $slug) {
            $this->assertArrayHasKey($slug, $byslug);

            $tagline = trim((string) ($byslug[$slug]['tagline'] ?? ''));

            $this->assertNotSame('', $tagline, "{$slug} has no tagline.");
            $this->assertGreaterThan(
                40,
                mb_strlen($tagline),
                "{$slug}'s tagline is too short to tell anyone whether it is the package they need.",
            );
        }
    }
}
