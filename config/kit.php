<?php

/**
 * The KIT version — the set of package releases that shipped and were tested
 * together. Distinct from any individual package's version, which moves
 * independently.
 *
 * It lives in `kit.json` at the project root rather than here because two
 * runtimes need it: PHP reads it through this config, and `vite.config.js`
 * reads the same file to inject `__KIT_VERSION__` into the client bundle. One
 * literal, two readers — the alternative is the same string typed in both
 * places, which is how the react-fancy version in the footer once drifted
 * twelve minor versions behind before anyone noticed.
 *
 * Bump it at a kit cut, alongside the maintenance branches for the outgoing
 * line. See `.ai/plans/kit-versioning-and-support.md` in the envelope.
 */
$kit = json_decode((string) file_get_contents(base_path('kit.json')), true) ?: [];

return [
    'version' => $kit['version'] ?? '0.0',
];
