<?php

it('dogfoods the published Fancy TUI Human+ stack', function () {
    $root = dirname(__DIR__, 3);
    $package = json_decode(file_get_contents($root.'/package.json'), true, flags: JSON_THROW_ON_ERROR);

    // Assert the dependency EXISTS rather than pinning its exact range — the
    // point is that the showcase consumes the published packages, and pinning
    // the string means every routine version bump fails a test that has
    // nothing to say about the bump.
    expect($package['dependencies'])
        ->toHaveKey('@particle-academy/fancy-tui')
        ->toHaveKey('@particle-academy/agent-integrations')
        ->toHaveKey('ink')
        ->and($package['scripts'])
        ->toHaveKey('tui:agent')
        ->toHaveKey('tui:smoke')
        ->and($root.'/resources/tui/agent-console.tsx')
        ->toBeFile();
});
