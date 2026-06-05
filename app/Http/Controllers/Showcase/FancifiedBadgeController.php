<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Serves the public, embeddable "Fancified" SVG badge that repo owners paste
 * into their README. It's the repo equivalent of the website Fancy Pixel: a
 * verifiable mark whose presence the RepoVerifier scans for.
 *
 * Public (outside the auth group) so GitHub's README renderer can hot-link it.
 * The optional `?site=KEY` query ties a given badge to a submission — it's
 * rendered identically, but the key lets the verifier confirm THIS repo's badge
 * (not just any Fancified badge) is present.
 */
class FancifiedBadgeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        // Echoed into the SVG only as an inert <!-- comment --> for traceability.
        // Sanitised hard so the badge can never become an XSS/SVG-injection vector.
        $site = (string) $request->query('site', '');
        $site = preg_replace('/[^a-z0-9]/i', '', $site) ?? '';
        $site = substr($site, 0, 32);

        $svg = $this->renderSvg($site);

        return response($svg, 200, [
            'Content-Type' => 'image/svg+xml',
            'Cache-Control' => 'public, max-age=86400, s-maxage=86400',
        ]);
    }

    private function renderSvg(string $site): string
    {
        $label = '⚡ Fancified';
        $comment = $site !== '' ? "<!-- site:{$site} -->" : '';

        // A small flat badge — violet field, white wordmark + bolt.
        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="104" height="20" role="img" aria-label="{$label}">{$comment}
  <title>{$label}</title>
  <linearGradient id="fancified-g" x2="0" y2="100%">
    <stop offset="0" stop-color="#8b5cf6"/>
    <stop offset="1" stop-color="#7c3aed"/>
  </linearGradient>
  <rect rx="3" width="104" height="20" fill="url(#fancified-g)"/>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,DejaVu Sans,Geneva,sans-serif" font-size="11">
    <text x="52" y="14">{$label}</text>
  </g>
</svg>
SVG;
    }
}
