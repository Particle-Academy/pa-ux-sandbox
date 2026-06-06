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
        $comment = $site !== '' ? "<!-- site:{$site} -->" : '';

        // A fancy gradient badge: violet→fuchsia field, a sparkle glyph in a
        // darker chip, a glossy top highlight, and the "Fancified" wordmark.
        // Pure static SVG (no scripts/animation) so GitHub's camo proxy renders
        // it inside README files.
        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="28" role="img" aria-label="Fancified — built with Fancy UI">{$comment}
  <title>Fancified · built with Fancy UI</title>
  <defs>
    <linearGradient id="fcdBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6d28d9"/>
      <stop offset=".5" stop-color="#9333ea"/>
      <stop offset="1" stop-color="#d946ef"/>
    </linearGradient>
    <linearGradient id="fcdGloss" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".30"/>
      <stop offset=".55" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="fcdClip"><rect width="128" height="28" rx="7"/></clipPath>
  </defs>
  <g clip-path="url(#fcdClip)">
    <rect width="128" height="28" fill="url(#fcdBg)"/>
    <rect width="34" height="28" fill="#3b0764" fill-opacity=".5"/>
    <rect width="128" height="13" fill="url(#fcdGloss)"/>
    <g fill="#fff">
      <path transform="translate(17 14)" d="M0 -7 C.6 -2.2 2.2 -.6 7 0 C2.2 .6 .6 2.2 0 7 C-.6 2.2 -2.2 .6 -7 0 C-2.2 -.6 -.6 -2.2 0 -7 Z"/>
      <path transform="translate(25.5 7.5) scale(.34)" fill-opacity=".85" d="M0 -7 C.6 -2.2 2.2 -.6 7 0 C2.2 .6 .6 2.2 0 7 C-.6 2.2 -2.2 .6 -7 0 C-2.2 -.6 -.6 -2.2 0 -7 Z"/>
    </g>
    <text x="81" y="18.5" fill="#ffffff" text-anchor="middle" font-family="'Segoe UI',Verdana,'DejaVu Sans',sans-serif" font-size="12" font-weight="700" letter-spacing=".3">Fancified</text>
  </g>
  <rect x=".5" y=".5" width="127" height="27" rx="6.5" fill="none" stroke="#ffffff" stroke-opacity=".22"/>
</svg>
SVG;
    }
}
