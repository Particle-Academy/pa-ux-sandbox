<?php

declare(strict_types=1);

namespace App\Services\Showcase;

use Spatie\Browsershot\Browsershot;

/**
 * Renders one of this site's own pages to JPEG bytes for a package page
 * screenshot, through the same Browsershot plumbing (and `screenshots.*`
 * config) the heatmap captures use. Headless, one browser per call.
 *
 * Only ever pointed at this site by `packages:screenshots`, never at a
 * submitted URL: it does no SSRF vetting of its own.
 */
class PackageShotRenderer
{
    public const WIDTH = 1440;

    public const HEIGHT = 900;

    /** Site chrome that floats over a capture and is not the package. */
    private const HIDE_CHROME = '[data-fancy-compliance="banner"] { display: none !important; }';

    public function render(string $url, ?string $selector): string
    {
        $shot = Browsershot::url($url)
            ->setScreenshotType('jpeg', 82)
            ->windowSize(self::WIDTH, self::HEIGHT)
            ->deviceScaleFactor(1)
            ->ignoreHttpsErrors()
            ->waitUntilNetworkIdle()
            // Charts, canvases and entrance transitions settle after idle.
            ->setDelay(1500)
            ->dismissDialogs()
            // The site's own consent banner floats over whatever is captured;
            // a capture is not a visitor and records no consent either way.
            ->setOption('addStyleTag', json_encode(['content' => self::HIDE_CHROME]))
            ->timeout((int) config('screenshots.timeout', 60));

        if ($selector !== null) {
            $shot->select($selector);
        }
        if ($node = config('screenshots.node_binary')) {
            $shot->setNodeBinary($node);
        }
        if ($npm = config('screenshots.npm_binary')) {
            $shot->setNpmBinary($npm);
        }
        if ($chrome = config('screenshots.chrome_path')) {
            $shot->setChromePath($chrome);
        }
        if (config('screenshots.no_sandbox', false)) {
            $shot->noSandbox();
        }

        return $shot->screenshot();
    }
}
