<?php

use App\Models\User;
use App\Support\Notices\WhatsNewFeed;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

uses(TestCase::class);

/*
 * The showcase dogfoods fancy-whats-new: on the first load after a deploy or a
 * login, it shows the package releases and curated feature notices newer than
 * what this person last saw.
 *
 * `GET /whats-new?since=<cursor>` answers fancy-whats-new's `load(since)`:
 * groups NEWER than the cursor, newest first. The cursor sorts as a string
 * (`<UTC timestamp>~<kind>~<key>`), so "newer than" is a comparison, not a
 * lookup, and a cursor whose group has since been removed still filters.
 */

/** Fixture artifacts in their own directory, bound as the app's feed. */
function whatsNewFixture(array $releases, array $notices = [], array $latest = []): void
{
    $dir = storage_path('framework/testing/whats-new-'.uniqid());
    File::ensureDirectoryExists($dir);
    File::put($dir.'/releases.json', json_encode(['latest' => $latest, 'releases' => $releases]));
    File::put($dir.'/features.json', json_encode($notices));

    app()->instance(WhatsNewFeed::class, new WhatsNewFeed($dir.'/releases.json', $dir.'/features.json'));
}

function whatsNewRelease(string $slug, string $version, string $at, bool $first = false): array
{
    return ['slug' => $slug, 'registry' => 'npm', 'version' => $version, 'published_at' => $at, 'first' => $first];
}

beforeEach(function () {
    whatsNewFixture(
        releases: [
            whatsNewRelease('react-fancy', '5.53.1', '2026-10-21T07:55:25Z'),
            whatsNewRelease('react-fancy', '5.54.0', '2026-10-21T15:50:30Z'),
            whatsNewRelease('fancy-whats-new', '0.1.0', '2026-10-21T18:06:29Z', first: true),
            // Not a visible package: never announced.
            whatsNewRelease('no-such-package', '1.0.0', '2026-10-21T19:00:00Z'),
        ],
        notices: [[
            'id' => 'secure-pdf-viewer',
            'label' => 'New feature',
            'date' => '2026-10-21T15:50:30Z',
            'cards' => [[
                'title' => 'PdfViewer page images',
                'description' => 'Shows server-rendered page images.',
                'image' => '/showcase-assets/file-viewer/pages/1.png',
                'action' => ['label' => 'See the PdfViewer', 'href' => '/packages/react-fancy/pdf-viewer'],
            ]],
        ]],
    );
});

it('returns every group newest first, with a stable cursor', function () {
    $groups = $this->getJson('/whats-new')->assertOk()->json();

    expect(array_column($groups, 'id'))->toBe([
        '2026-10-21T18:06:29Z~release~fancy-whats-new@0.1.0',
        '2026-10-21T15:50:30Z~release~react-fancy@5.54.0',
        '2026-10-21T15:50:30Z~notice~secure-pdf-viewer',
        '2026-10-21T07:55:25Z~release~react-fancy@5.53.1',
    ]);

    // Stable: asking again gives the identical answer.
    expect($this->getJson('/whats-new')->json())->toBe($groups);
});

it('describes a new package, a new version and a curated notice', function () {
    $groups = collect($this->getJson('/whats-new')->json())->keyBy('id');

    $package = $groups['2026-10-21T18:06:29Z~release~fancy-whats-new@0.1.0'];
    expect($package['label'])->toBe('New package')
        ->and($package['date'])->toBe('Oct 21, 2026')
        ->and($package['cards'][0]['title'])->toBe('fancy-whats-new 0.1.0')
        ->and($package['cards'][0]['action'])->toBe(['label' => 'View package', 'href' => '/packages/fancy-whats-new']);

    $version = $groups['2026-10-21T15:50:30Z~release~react-fancy@5.54.0'];
    expect($version['label'])->toBe('Release')
        ->and($version['cards'][0]['title'])->toBe('react-fancy 5.54.0')
        ->and($version['cards'][0]['description'])->toBe('Version 5.54.0 is on npm.');

    $notice = $groups['2026-10-21T15:50:30Z~notice~secure-pdf-viewer'];
    expect($notice['label'])->toBe('New feature')
        ->and($notice['cards'][0]['image'])->toBe('/showcase-assets/file-viewer/pages/1.png')
        ->and($notice['cards'][0]['action']['href'])->toBe('/packages/react-fancy/pdf-viewer');
});

it('returns only the groups newer than since', function () {
    $groups = $this->getJson('/whats-new?since='.urlencode('2026-10-21T15:50:30Z~notice~secure-pdf-viewer'))->json();

    expect(array_column($groups, 'id'))->toBe([
        '2026-10-21T18:06:29Z~release~fancy-whats-new@0.1.0',
        '2026-10-21T15:50:30Z~release~react-fancy@5.54.0',
    ]);
});

it('returns nothing for the newest cursor', function () {
    $this->getJson('/whats-new?since='.urlencode('2026-10-21T18:06:29Z~release~fancy-whats-new@0.1.0'))
        ->assertOk()
        ->assertExactJson([]);
});

it('filters on a cursor whose group no longer exists', function () {
    $groups = $this->getJson('/whats-new?since='.urlencode('2026-10-21T16:00:00Z~release~gone@1.0.0'))->json();

    expect(array_column($groups, 'id'))->toBe(['2026-10-21T18:06:29Z~release~fancy-whats-new@0.1.0']);
});

it('treats an unreadable cursor as a first visit', function () {
    expect($this->getJson('/whats-new?since=garbage')->json())
        ->toBe($this->getJson('/whats-new')->json());
});

it('keeps a first visit short', function () {
    $releases = [];
    for ($i = 10; $i < 30; $i++) {
        $releases[] = whatsNewRelease('react-fancy', "5.{$i}.0", "2026-09-{$i}T00:00:00Z");
    }
    whatsNewFixture($releases);

    expect($this->getJson('/whats-new')->json())->toHaveCount(WhatsNewFeed::FIRST_VISIT_LIMIT)
        ->and($this->getJson('/whats-new?since='.urlencode('2026-01-01T00:00:00Z~release~x@0'))->json())
        ->toHaveCount(20);
});

it('stores and returns the signed-in cursor', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->getJson('/me/seen-notices')->assertOk()->assertExactJson(['seen' => null]);

    $cursor = '2026-10-21T18:06:29Z~release~fancy-whats-new@0.1.0';
    $this->actingAs($user)->putJson('/me/seen-notices', ['seen' => $cursor])->assertNoContent();

    expect($user->fresh()->seen_notices)->toBe($cursor);
    $this->actingAs($user)->getJson('/me/seen-notices')->assertOk()->assertExactJson(['seen' => $cursor]);
});

it('validates the stored cursor', function (mixed $seen) {
    $user = User::factory()->create();

    $this->actingAs($user)->putJson('/me/seen-notices', ['seen' => $seen])->assertUnprocessable();
})->with([
    'missing' => [null],
    'too long' => [str_repeat('x', 192)],
    'not a string' => [['a']],
]);

it('keeps the cursor behind sign-in', function () {
    $this->getJson('/me/seen-notices')->assertUnauthorized();
    $this->putJson('/me/seen-notices', ['seen' => 'x'])->assertUnauthorized();
});
