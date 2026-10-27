<?php

use Tests\TestCase;

uses(TestCase::class);

/*
 * The site footer sits on every page, after whatever heading the page ended on
 * (usually an h2 or h3). Its column labels were h5s, so every page skipped a
 * heading level in the footer. The footer is the page's top-level contentinfo
 * landmark, so its labels are h2s: a step UP never skips, from any level.
 */
it('labels the footer columns with headings that never skip a level', function () {
    $layout = (string) file_get_contents(resource_path('js/Pages/Layout.tsx'));
    preg_match('#<footer\b.*?</footer>#s', $layout, $footer);

    expect($footer[0] ?? '')->not->toMatch('#<h[3-6]\b#')
        ->and(substr_count($footer[0] ?? '', '<h2 className="footer__heading">'))->toBe(4);
});

it('keeps the footer headings styled as they were', function () {
    $css = (string) file_get_contents(resource_path('css/showcase/landing.css'));

    expect($css)->not->toContain('.footer h5')
        ->and($css)->toMatch('#\.footer \.footer__heading \{[^}]*font-size: 11\.5px#');
});
