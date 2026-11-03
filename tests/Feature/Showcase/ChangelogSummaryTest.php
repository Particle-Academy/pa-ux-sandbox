<?php

use App\Support\Notices\ChangelogSummary;

/*
 * The one line a "What's new" release card says about what changed. It comes
 * from the release's OWN changelog section, or it is null: never another
 * version's text, never a description, never something invented.
 *
 * The heading forms below are every one found across the repos on 2026-11-03.
 */

function summaryChangelog(string $heading, string $body = "### Added\n\n- **The right one.** Details follow.\n"): string
{
    return "# Changelog\n\n## [Unreleased]\n\n### Added\n\n- **Not released yet.** Still in progress.\n\n"
        ."{$heading}\n\n{$body}\n## [0.0.1] - 2020-01-01\n\n### Added\n\n- **The older one.** Previous text.\n";
}

it('finds the section under every heading form in use', function (string $heading) {
    expect(ChangelogSummary::forVersion(summaryChangelog($heading), '1.2.3'))->toBe('The right one');
})->with([
    'brackets, hyphen, date' => '## [1.2.3] - 2026-11-01',
    'brackets, em dash, date' => '## [1.2.3] — 2026-11-01',
    'bare, em dash, date' => '## 1.2.3 — 2026-11-01',
    'bare, hyphen, date' => '## 1.2.3 - 2026-11-01',
    'bare' => '## 1.2.3',
    'brackets only' => '## [1.2.3]',
    'v prefix, em dash, date' => '## v1.2.3 — 2026-11-01',
    'v prefix' => '## v1.2.3',
    'brackets, unreleased' => '## [1.2.3] - unreleased',
    'brackets, em dash, unreleased' => '## [1.2.3] — unreleased',
    'bare, parenthesis' => '## 1.2.3 — 2026-11-01 (scaffold, unreleased)',
    'brackets, trailing note' => '## [1.2.3] - 2026-11-01 — tagged, not published (see above)',
    'linked brackets' => '## [1.2.3](https://example.com/compare) - 2026-11-01',
]);

it('takes exactly that version and nothing near it', function (string $version) {
    $changelog = <<<'MD'
    ## [0.1.10] - 2026-11-03

    - **Ten.**

    ## [0.1.1-rc.1] - 2026-11-02

    - **The candidate.**

    ## [0.1.1-dev.2] - 2026-11-02

    - **The dev build.**

    ## [10.1.1] - 2026-11-01

    - **Ten dot one.**

    ## [0.1.0] - 2026-10-01

    - **Zero.**
    MD;

    expect(ChangelogSummary::forVersion(str_replace("\n    ", "\n", $changelog), $version))->toBeNull();
})->with(['0.1.1', '0.1', '1.1', '.1.1', '0.1.1.1', '0x1x1']);

it('picks 0.1.1 itself from between 0.1.10 and 0.1.0', function () {
    $changelog = "## [0.1.10]\n\n- **Ten.**\n\n## [0.1.1-rc.1]\n\n- **The candidate.**\n\n## [0.1.1]\n\n- **One.**\n\n## [0.1.0]\n\n- **Zero.**\n";

    expect(ChangelogSummary::forVersion($changelog, '0.1.1'))->toBe('One')
        ->and(ChangelogSummary::forVersion($changelog, '0.1.10'))->toBe('Ten')
        ->and(ChangelogSummary::forVersion($changelog, '0.1.0'))->toBe('Zero');
});

it('does not read a roll-up heading as that release', function (string $heading) {
    expect(ChangelogSummary::forVersion("{$heading}\n\n- **Many things.**\n", '1.2.3'))->toBeNull();
})->with([
    '## 1.2.3 and earlier',
    '## [1.2.3] — earlier',
    '## v1.2.3 — earlier',
    '## 1.2.3 – 1.4.0',
]);

it('gives null when there is nothing honest to say', function (string $changelog) {
    expect(ChangelogSummary::forVersion($changelog, '1.2.3'))->toBeNull();
})->with([
    'no file content' => '',
    'no section' => "## [1.2.4]\n\n- **Another version.**\n",
    'empty section, then the previous one' => "## [1.2.3]\n\n## [1.2.2]\n\n- **The previous entry.**\n",
    'headings only' => "## [1.2.3]\n\n### Added\n\n### Fixed\n\n## [1.2.2]\n\n- **The previous entry.**\n",
    'only a consumer note' => "## [1.2.3]\n\n**What you must do: nothing.** One new method.\n",
    'only a code block' => "## [1.2.3]\n\n```bash\nnpm install\n```\n",
    'an empty bullet' => "## [1.2.3]\n\n- \n",
    'punctuation only' => "## [1.2.3]\n\n- ---\n",
]);

it('uses the bold lead of the first bullet', function (string $bullet, string $expected) {
    expect(ChangelogSummary::forVersion("## [1.2.3]\n\n### Fixed\n\n{$bullet}\n\n- **The second.**\n", '1.2.3'))->toBe($expected);
})->with([
    'with a period' => ['- **Cancel button contrast.** It was unreadable.', 'Cancel button contrast'],
    'running on' => ['- **`Toast.Stack` puts the front card first in the DOM**, then the cards behind.', 'Toast.Stack puts the front card first in the DOM'],
    'wrapped over lines' => ["- **Flow bridge: `flow_set_node_status` no longer reports a false\n  \"No node\" error.** On the legacy path it did.", 'Flow bridge: flow_set_node_status no longer reports a false "No node" error'],
    'a question stays one' => ['- **Why so slow?** It was not.', 'Why so slow?'],
    'two sentences in the bold' => ['- **A width is honoured. It was ignored.** More.', 'A width is honoured'],
    'asterisk bullets' => ['* **Asterisk bullet.** Fine.', 'Asterisk bullet'],
    'underscore bold' => ['- __Underscore bold.__ Fine.', 'Underscore bold'],
]);

it('keeps the sentence when a bold lead is only a name', function (string $bullet, string $expected) {
    expect(ChangelogSummary::forVersion("## [1.2.3]\n\n{$bullet}\n", '1.2.3'))->toBe($expected);
})->with([
    'colon' => ["- **`DeckFileView`**: a .pptx in fancy-code's `FileViewer`. Register it once.", "DeckFileView: a .pptx in fancy-code's FileViewer"],
    'dash' => ['- **`Dropdown`** — the menu works from the keyboard. It did not.', 'Dropdown: the menu works from the keyboard'],
    'name inside the bold' => ['- **`Agent::layout()`.** Computes the page count. More.', 'Agent::layout(): Computes the page count'],
    'nothing after it' => ['- **`DeckFileView`**', 'DeckFileView'],
]);

it('keeps a BREAKING label on the entry it marks', function () {
    expect(ChangelogSummary::forVersion("## [1.2.3]\n\n- **BREAKING:** kind ids are namespaced. Bare names alias.\n", '1.2.3'))
        ->toBe('BREAKING: kind ids are namespaced')
        ->and(ChangelogSummary::forVersion("## [1.2.3]\n\n### Changed\n\n- **BREAKING: kind ids are namespaced.** Bare names alias.\n", '1.2.3'))
        ->toBe('BREAKING: kind ids are namespaced');
});

it('reads a section that is only a BREAKING note', function () {
    expect(ChangelogSummary::forVersion("## [1.2.3]\n\n**BREAKING:** kind ids are namespaced. Bare names alias.\n\n## [1.2.2]\n\n- **Old.**\n", '1.2.3'))
        ->toBe('BREAKING: kind ids are namespaced');
});

it('uses the first sentence of a bullet with no bold lead', function (string $bullet, string $expected) {
    expect(ChangelogSummary::forVersion("## [1.2.3]\n\n### Fixed\n\n{$bullet}\n", '1.2.3'))->toBe($expected);
})->with([
    'plain' => ['- Native icons retain their sizing. Fixed wrappers now live elsewhere.', 'Native icons retain their sizing'],
    'wrapped' => ["- Native icons retain their sizing\n  under a nonce-only policy. More here.", 'Native icons retain their sizing under a nonce-only policy'],
    'version numbers do not end it' => ['- Takes fancy-flow 0.84.0 for contrast. More here.', 'Takes fancy-flow 0.84.0 for contrast'],
    'abbreviations do not end it' => ['- Accepts a host, e.g. Laravel, as a peer. More here.', 'Accepts a host, e.g. Laravel, as a peer'],
    'no period at all' => ['- Native icons retain their sizing', 'Native icons retain their sizing'],
    'a next sentence starting lowercase' => ['- Page decoration. page.background paints it.', 'Page decoration'],
    'stops before a nested list' => ["- Three things changed:\n  - one\n  - two", 'Three things changed'],
    'stops before a code block' => ["- Pass the option\n  ```ts\n  x()\n  ```", 'Pass the option'],
    'numbered' => ['1. The first step. Then more.', 'The first step'],
]);

it('prefers a real entry to the preamble and the odd subsection', function () {
    $section = <<<'MD'
    ## [1.2.3] - 2026-11-01

    **What you must do: nothing.** One new method; nothing existing changed.

    ### Upgrade

    - Run the migration.

    ### Added

    - **`Agent::layout` computes the page count without a browser.** Returns pages.
    MD;

    expect(ChangelogSummary::forVersion(str_replace("\n    ", "\n", $section), '1.2.3'))
        ->toBe('Agent::layout computes the page count without a browser');
});

it('skips consumer notes that are bullets', function () {
    expect(ChangelogSummary::forVersion("## [1.2.3]\n\n- **Nothing to do.** Additive.\n- **The real one.**\n", '1.2.3'))
        ->toBe('The real one');
});

it('falls back to another subsection, then to prose, when there are no standard entries', function () {
    expect(ChangelogSummary::forVersion("## [1.2.3]\n\n### Upgrade\n\n- Run the migration. It is quick.\n", '1.2.3'))
        ->toBe('Run the migration')
        ->and(ChangelogSummary::forVersion("## [1.2.3]\n\nIn-person courses can now be tracked to completion. Until now they could not.\n", '1.2.3'))
        ->toBe('In-person courses can now be tracked to completion')
        ->and(ChangelogSummary::forVersion("## [1.2.3]\n\n**What a consumer must do:** nothing.\n\nThe real prose. More.\n", '1.2.3'))
        ->toBe('The real prose');
});

it('ignores headings and bullets inside a code block', function () {
    $changelog = "## [1.2.3]\n\n```md\n- **Inside the fence.**\n## [1.2.4]\n```\n\n- **After the fence.**\n";

    expect(ChangelogSummary::forVersion($changelog, '1.2.3'))->toBe('After the fence')
        ->and(ChangelogSummary::forVersion($changelog, '1.2.4'))->toBeNull();
});

it('strips markdown down to plain text', function (string $bullet, string $expected) {
    expect(ChangelogSummary::forVersion("## [1.2.3]\n\n{$bullet}\n", '1.2.3'))->toBe($expected);
})->with([
    'code' => ['- Adds `registerFoo` for hosts. More.', 'Adds registerFoo for hosts'],
    'bold mid-sentence' => ['- Adds a **very** good thing. More.', 'Adds a very good thing'],
    'italic' => ['- Adds a *very* good _thing_. More.', 'Adds a very good thing'],
    'link' => ['- See [the docs](https://example.com/a_b) for it. More.', 'See the docs for it'],
    'reference link' => ['- See [the docs][1] for it. More.', 'See the docs for it'],
    'image' => ['- Shows ![a chart](https://example.com/c.png) inline. More.', 'Shows inline'],
    'autolink' => ['- Moved to <https://example.com/x>. More.', 'Moved to https://example.com/x'],
    'snake_case survives' => ['- Adds flow_set_node and for_each_item. More.', 'Adds flow_set_node and for_each_item'],
    'code keeps its stars' => ['- Adds `register*Bridge*` helpers. More.', 'Adds register*Bridge* helpers'],
    'an html comment' => ['- Adds it <!-- hidden -->. More.', 'Adds it'],
    'escaped' => ['- Adds \*literal\* stars. More.', 'Adds *literal* stars'],
    'a component tag' => ['- Fixes `<Button>` contrast. More.', 'Fixes <Button> contrast'],
]);

it('is one line, capped, and cut at a word boundary', function () {
    $long = str_repeat('wordy ', 60);

    $summary = ChangelogSummary::forVersion("## [1.2.3]\n\n- {$long}\n", '1.2.3');

    expect(mb_strlen($summary))->toBeLessThanOrEqual(ChangelogSummary::MAX_LENGTH)
        ->and($summary)->toEndWith('wordy…')
        ->and($summary)->not->toContain("\n");

    // A bold lead is capped the same way.
    $bold = ChangelogSummary::forVersion('## [1.2.3]'."\n\n- **".trim($long).".** More.\n", '1.2.3');
    expect(mb_strlen($bold))->toBeLessThanOrEqual(ChangelogSummary::MAX_LENGTH)
        ->and($bold)->toEndWith('wordy…');
});

it('leaves a line that exactly fits alone', function () {
    $fits = str_repeat('a', ChangelogSummary::MAX_LENGTH - 5).' tail';

    expect(ChangelogSummary::forVersion("## [1.2.3]\n\n- {$fits}\n", '1.2.3'))->toBe($fits);
});

it('never cuts inside a word', function () {
    expect(ChangelogSummary::forVersion("## [1.2.3]\n\n- ".str_repeat('x', 500)."\n", '1.2.3'))->toBeNull();
});

it('strips control characters and terminal escapes', function () {
    $dirty = '- Adds'.chr(7).' a'.chr(0).' thing'.chr(27).'[31m in red'.chr(27).'[0m'."\t".'here'."\u{2028}".'now'."\u{202E}".'. More.';

    expect(ChangelogSummary::forVersion("## [1.2.3]\n\n{$dirty}\n", '1.2.3'))->toBe('Adds a thing in red here now');
});

it('survives bytes that are not UTF-8', function () {
    $summary = ChangelogSummary::forVersion("## [1.2.3]\n\n- Adds caf\xE9 mode. More.\n", '1.2.3');

    expect($summary)->toStartWith('Adds caf')
        ->and(json_encode($summary, JSON_THROW_ON_ERROR))->toBeString();
});

it('handles CRLF changelogs', function () {
    expect(ChangelogSummary::forVersion("## [1.2.3] - 2026-11-01\r\n\r\n### Fixed\r\n\r\n- **Windows line endings.** Fine.\r\n\r\n## [1.2.2]\r\n\r\n- **Old.**\r\n", '1.2.3'))
        ->toBe('Windows line endings');
});

it('keeps a script tag as inert text', function () {
    $summary = ChangelogSummary::forVersion("## [1.2.3]\n\n- **<script>alert(1)</script> handled.** More.\n", '1.2.3');

    // Text, not markup: React escapes it, and the artifact holds it as a string.
    expect($summary)->toBe('<script>alert(1)</script> handled');
});
