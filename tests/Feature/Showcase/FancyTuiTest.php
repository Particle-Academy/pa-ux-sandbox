<?php

it('dogfoods the published Fancy TUI Human+ stack', function () {
    $root = dirname(__DIR__, 3);
    $package = json_decode(file_get_contents($root.'/package.json'), true, flags: JSON_THROW_ON_ERROR);

    expect($package['dependencies'])
        ->toHaveKey('@particle-academy/fancy-tui', '^0.1.1')
        ->toHaveKey('@particle-academy/agent-integrations', '^0.29.0')
        ->toHaveKey('ink', '^7.1.1')
        ->and($package['scripts'])
        ->toHaveKey('tui:agent')
        ->toHaveKey('tui:smoke')
        ->and($root.'/resources/tui/agent-console.tsx')
        ->toBeFile();
});
