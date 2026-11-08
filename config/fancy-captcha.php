<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| fancy-captcha, as the showcase uses it
|--------------------------------------------------------------------------
|
| The package deep-merges this over its own config, so only what differs is
| here. The one form behind a captcha is the live demo on
| /features/compliance (route `features.compliance.captcha`). Proof-of-work
| is on so the demo shows the real Web Worker solve; it costs nothing on any
| page without a captcha.
|
*/

return [
    'pow' => [
        'enabled' => (bool) env('CAPTCHA_POW', true),
    ],
];
