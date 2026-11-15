<?php

use App\Models\PackageDownload;
use App\Support\Downloads\PublishedNames;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    Http::preventStrayRequests();
    Sleep::fake();
    Carbon::setTestNow('2026-11-15 04:30:00');
    config([
        'package-downloads.delay_ms' => 250,
        'package-downloads.timeout' => 7,
        'package-downloads.npm.chunk_months' => 18,
        'package-downloads.npm.history_start' => '2023-01-01',
    ]);
});

afterEach(fn () => Carbon::setTestNow());

/** The npm range payload for one chunk, with every day's count supplied. */
function npmRange(array $counts): array
{
    return ['downloads' => array_map(fn (int $n, int $i) => ['day' => "d{$i}", 'downloads' => $n], $counts, array_keys($counts))];
}

it('stores npm last-month, last-week and an all-time total summed over range chunks', function () {
    Http::fake([
        'api.npmjs.org/downloads/point/last-month/@particle-academy/react-fancy' => Http::response(['downloads' => 28_700]),
        'api.npmjs.org/downloads/point/last-week/@particle-academy/react-fancy' => Http::response(['downloads' => 6_100]),
        // Newest chunk first, then the one before it; the third is empty, so
        // the walk stops there rather than reaching history_start.
        'api.npmjs.org/downloads/range/2025-05-16:2026-11-15/@particle-academy/react-fancy' => Http::response(npmRange([40_000, 2_000])),
        'api.npmjs.org/downloads/range/2023-11-16:2025-05-15/@particle-academy/react-fancy' => Http::response(npmRange([500])),
        'api.npmjs.org/downloads/range/2023-01-01:2023-11-15/@particle-academy/react-fancy' => Http::response(npmRange([0, 0])),
    ]);

    $this->artisan('packages:fetch-downloads', ['--package' => ['react-fancy']])->assertSuccessful();

    $row = PackageDownload::query()->where('slug', 'react-fancy')->sole();
    expect($row->source)->toBe('npm')
        ->and($row->name)->toBe('@particle-academy/react-fancy')
        ->and($row->monthly)->toBe(28_700)
        ->and($row->weekly)->toBe(6_100)
        ->and($row->total)->toBe(42_500)
        ->and($row->daily)->toBeNull()
        ->and($row->fetched_at->toDateTimeString())->toBe('2026-11-15 04:30:00')
        ->and($row->last_error)->toBeNull();
});

it('never asks npm for a range longer than 18 months, whatever the config says', function () {
    config(['package-downloads.npm.chunk_months' => 40]);
    Http::fake([
        'api.npmjs.org/downloads/point/*' => Http::response(['downloads' => 1]),
        'api.npmjs.org/downloads/range/*' => Http::response(npmRange([1])),
    ]);

    $this->artisan('packages:fetch-downloads', ['--package' => ['react-fancy']])->assertSuccessful();

    $ranges = Http::recorded()
        ->map(fn (array $pair) => $pair[0]->url())
        ->filter(fn (string $url) => str_contains($url, '/range/'))
        ->values();

    expect($ranges)->not->toBeEmpty();
    foreach ($ranges as $url) {
        preg_match('#/range/(\d{4}-\d\d-\d\d):(\d{4}-\d\d-\d\d)/#', $url, $m);
        expect(Carbon::parse($m[1])->diffInMonths(Carbon::parse($m[2])))->toBeLessThanOrEqual(18);
    }
});

it('stores Packagist total, monthly and daily', function () {
    Http::fake([
        'packagist.org/packages/particle-academy/holy-sheet.json' => Http::response([
            'package' => ['downloads' => ['total' => 9_876, 'monthly' => 1_234, 'daily' => 56]],
        ]),
    ]);

    $this->artisan('packages:fetch-downloads', ['--package' => ['holy-sheet']])->assertSuccessful();

    $row = PackageDownload::query()->where('slug', 'holy-sheet')->sole();
    expect($row->source)->toBe('packagist')
        ->and($row->total)->toBe(9_876)
        ->and($row->monthly)->toBe(1_234)
        ->and($row->daily)->toBe(56)
        ->and($row->weekly)->toBeNull();
});

it('stores PyPI recent counts, with no all-time total because pypistats has none', function () {
    Http::fake([
        'pypistats.org/api/packages/fancy-holy-sheet/recent' => Http::response([
            'data' => ['last_day' => 3, 'last_week' => 40, 'last_month' => 210],
        ]),
    ]);

    $this->artisan('packages:fetch-downloads', ['--package' => ['holy-sheet-py']])->assertSuccessful();

    $row = PackageDownload::query()->where('slug', 'holy-sheet-py')->sole();
    expect($row->source)->toBe('pypi')
        ->and($row->name)->toBe('fancy-holy-sheet')
        ->and($row->daily)->toBe(3)
        ->and($row->weekly)->toBe(40)
        ->and($row->monthly)->toBe(210)
        ->and($row->total)->toBeNull();
});

it('keeps the last known value and records the failure when a source errors', function () {
    $before = Carbon::parse('2026-11-14 04:30:00');
    PackageDownload::create([
        'slug' => 'holy-sheet', 'source' => 'packagist', 'name' => 'particle-academy/holy-sheet',
        'monthly' => 1_000, 'total' => 5_000, 'daily' => 30, 'fetched_at' => $before,
    ]);
    Http::fake(['packagist.org/*' => Http::response('upstream sad', 503)]);

    $this->artisan('packages:fetch-downloads', ['--package' => ['holy-sheet']])->assertFailed();

    $row = PackageDownload::query()->where('slug', 'holy-sheet')->sole();
    expect($row->monthly)->toBe(1_000)
        ->and($row->total)->toBe(5_000)
        ->and($row->daily)->toBe(30)
        ->and($row->fetched_at->equalTo($before))->toBeTrue()
        ->and($row->last_error)->toContain('503')
        ->and($row->failed_at->toDateTimeString())->toBe('2026-11-15 04:30:00')
        ->and($row->consecutive_failures)->toBe(1);
});

it('keeps the last known value when a request times out', function () {
    PackageDownload::create([
        'slug' => 'holy-sheet-py', 'source' => 'pypi', 'name' => 'fancy-holy-sheet',
        'monthly' => 77, 'weekly' => 20, 'daily' => 2, 'fetched_at' => now()->subDay(),
        'consecutive_failures' => 2,
    ]);
    Http::fake(['pypistats.org/*' => Http::failedConnection('cURL error 28: Operation timed out')]);

    $this->artisan('packages:fetch-downloads', ['--package' => ['holy-sheet-py']])->assertFailed();

    $row = PackageDownload::query()->where('slug', 'holy-sheet-py')->sole();
    expect($row->monthly)->toBe(77)
        ->and($row->last_error)->toContain('timed out')
        ->and($row->consecutive_failures)->toBe(3);
});

it('does not overwrite a good npm total with a partial one when a later chunk fails', function () {
    PackageDownload::create([
        'slug' => 'react-fancy', 'source' => 'npm', 'name' => '@particle-academy/react-fancy',
        'monthly' => 100, 'weekly' => 20, 'total' => 9_000, 'fetched_at' => now()->subDay(),
    ]);
    Http::fake([
        'api.npmjs.org/downloads/point/*' => Http::response(['downloads' => 200]),
        'api.npmjs.org/downloads/range/2025-05-16:2026-11-15/*' => Http::response(npmRange([10])),
        'api.npmjs.org/downloads/range/*' => Http::response(['error' => 'rate limited'], 429),
    ]);

    $this->artisan('packages:fetch-downloads', ['--package' => ['react-fancy']])->assertFailed();

    $row = PackageDownload::query()->where('slug', 'react-fancy')->sole();
    expect($row->monthly)->toBe(100)
        ->and($row->total)->toBe(9_000)
        ->and($row->last_error)->toContain('429');
});

it('records an unpublished name as a failure with no counts, never as zero', function () {
    Http::fake(['packagist.org/*' => Http::response(['status' => 'error'], 404)]);

    $this->artisan('packages:fetch-downloads', ['--package' => ['holy-sheet']])->assertFailed();

    $row = PackageDownload::query()->where('slug', 'holy-sheet')->sole();
    expect($row->monthly)->toBeNull()
        ->and($row->total)->toBeNull()
        ->and($row->fetched_at)->toBeNull()
        ->and($row->last_error)->toContain('404');
});

it('rejects a payload without the expected numbers instead of storing zero', function () {
    Http::fake(['packagist.org/*' => Http::response(['package' => ['name' => 'x']])]);

    $this->artisan('packages:fetch-downloads', ['--package' => ['holy-sheet']])->assertFailed();

    expect(PackageDownload::query()->where('slug', 'holy-sheet')->sole()->monthly)->toBeNull();
});

it('sends a generic User-Agent and the configured timeout, and pauses between requests', function () {
    Http::fake(['packagist.org/*' => Http::response([
        'package' => ['downloads' => ['total' => 1, 'monthly' => 1, 'daily' => 1]],
    ])]);

    $this->artisan('packages:fetch-downloads', ['--package' => ['holy-sheet', 'dark-slide']])->assertSuccessful();

    Http::assertSent(function (Request $request) {
        $ua = $request->header('User-Agent')[0] ?? '';

        return $ua === config('package-downloads.user_agent')
            && ! str_contains($ua, '@')
            && ! preg_match('/glenn|wishborn/i', $ua);
    });
    Http::assertSentCount(2);
    // One pause BETWEEN the two requests, none before the first.
    Sleep::assertSleptTimes(1);
    Sleep::assertSequence([Sleep::for(250)->milliseconds()]);
});

it('walks every published package across every ecosystem when no package is named', function () {
    Http::fake([
        'api.npmjs.org/downloads/point/*' => Http::response(['downloads' => 5]),
        'api.npmjs.org/downloads/range/*' => Http::response(npmRange([0])),
        'packagist.org/*' => Http::response(['package' => ['downloads' => ['total' => 9, 'monthly' => 3, 'daily' => 1]]]),
        'pypistats.org/*' => Http::response(['data' => ['last_day' => 1, 'last_week' => 2, 'last_month' => 4]]),
    ]);

    $this->artisan('packages:fetch-downloads')->assertSuccessful();

    $sources = PackageDownload::query()->where('slug', 'fancy-template')->pluck('source')->sort()->values()->all();
    expect($sources)->toBe(['npm', 'packagist', 'pypi'])
        ->and(PackageDownload::query()->count())->toBe(count(PublishedNames::targets()));
});

it('prints what it would fetch on --dry-run and makes no request', function () {
    $this->artisan('packages:fetch-downloads', ['--dry-run' => true, '--package' => ['last-word-js', 'holy-sheet-py']])
        ->expectsOutputToContain('last-word-js  [npm]')
        ->expectsOutputToContain('https://api.npmjs.org/downloads/point/last-month/@particle-academy/last-word')
        ->expectsOutputToContain('https://pypistats.org/api/packages/fancy-holy-sheet/recent')
        ->assertSuccessful();

    Http::assertNothingSent();
    expect(PackageDownload::query()->count())->toBe(0);
});

it('fails on a package slug it does not know', function () {
    $this->artisan('packages:fetch-downloads', ['--package' => ['no-such-package']])->assertFailed();
    Http::assertNothingSent();
});

it('is scheduled daily at the configured time', function () {
    $event = collect(app(Schedule::class)->events())
        ->first(fn ($e) => str_contains((string) $e->command, 'packages:fetch-downloads'));

    expect($event)->not->toBeNull()
        ->and($event->expression)->toBe('30 4 * * *');
});
