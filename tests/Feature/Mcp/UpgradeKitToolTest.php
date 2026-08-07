<?php

use App\Mcp\Tools\UpgradeKit;
use Laravel\Mcp\Request;
use Tests\TestCase;

uses(TestCase::class);

/**
 * The upgrade tool is the one an agent reaches for when someone else's app has
 * stopped resolving. What it must never do is give advice that is stale — the
 * current version and the support dates come from the same single sources the
 * site uses, not from prose typed into this class.
 */
function upgradeGuide(array $args = []): array
{
    $tool = new UpgradeKit;
    $response = $tool->handle(new Request($args));

    return json_decode($response->content(), true, 512, JSON_THROW_ON_ERROR);
}

it('names the current kit version from kit.json rather than a hardcoded string', function () {
    // The whole reason kit.json is the single source. A version typed in here
    // would keep telling people to upgrade to 0.5 forever.
    $guide = upgradeGuide();

    expect($guide['title'])->toContain(config('kit.version'));
});

it('leads with the fact that no API changed', function () {
    // The most common reason an upgrade gets deferred is the assumption that
    // "breaking" means code to rewrite. It does not, here.
    $guide = upgradeGuide();

    expect($guide['read_this_first'])->toContain('No component API changed');
});

it('pairs every breaking change with what the consumer must DO', function () {
    // A changelog that says only what changed is a warning, not a changelog.
    foreach (upgradeGuide()['what_breaks'] as $item) {
        expect($item)->toHaveKeys(['change', 'who_is_affected', 'what_you_must_do', 'how_it_will_show_up']);
        expect($item['what_you_must_do'])->not->toBeEmpty();
    }
});

it('warns that npm update alone does nothing on a 0.x caret', function () {
    // The single most likely way an upgrade silently fails: ^0.6.0 never
    // resolves 0.7.0, so the command appears to succeed and changes nothing.
    $json = json_encode(upgradeGuide());

    expect($json)->toContain('locks the MINOR');
});

it('carries the real support table, with derived dates', function () {
    $support = upgradeGuide()['support'];
    $versions = array_column($support['lines'], 'version');

    expect($versions)->toContain('0.4')->toContain('0.5');

    // 0.4 is superseded now, so it must carry real end dates rather than nulls.
    $line = collect($support['lines'])->firstWhere('version', '0.4');
    expect($line['bug_fixes_until'])->not->toBeNull();
    expect($line['security_fixes_until'])->not->toBeNull();
    expect($line['current'])->toBeFalse();
});

it('tells someone already on the current line that there is nothing to do', function () {
    $guide = upgradeGuide(['from' => config('kit.version')]);

    expect($guide['title'])->toContain('Already on kit');
    expect($guide)->not->toHaveKey('what_breaks');
});

it('accepts a v-prefixed or untidy version without falling over', function () {
    expect(upgradeGuide(['from' => 'v'.config('kit.version')])['title'])->toContain('Already on kit');
    // Unparseable input falls back to the full guide rather than erroring.
    expect(upgradeGuide(['from' => 'garbage'])['title'])->toContain('Upgrade Fancy UI');
});

it('still gives the full guide to someone on an older line', function () {
    $guide = upgradeGuide(['from' => '0.4']);

    expect($guide)->toHaveKey('what_breaks');
    expect($guide['how']['steps'])->not->toBeEmpty();
});

it('tells the reader to raise the platform before the packages', function () {
    // Upgrading packages first produces a resolution error that reads as a
    // broken package rather than an unmet floor, which is where people get
    // stuck.
    expect(upgradeGuide()['how']['order_matters'])->toContain('FIRST');
});
