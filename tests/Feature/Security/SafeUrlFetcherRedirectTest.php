<?php

use App\Services\Showcase\FetchFailedException;
use App\Services\Showcase\SafeUrlFetcher;
use App\Services\Showcase\UnsafeUrlException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

/*
 * Redirects are followed by the fetcher itself, one hop at a time, so every hop is
 * resolved, validated and pinned exactly like the first request.
 *
 * Under Guzzle's own redirect handling, on_redirect re-ran assertSafe on the new
 * URL, but the request to that URL carried only the FIRST host's CURLOPT_RESOLVE
 * pin, so curl resolved the new host itself, after the check. A host answering
 * public to the check and private to curl reached an internal address. The same
 * happened to an http to https hop on one host: the pin named port 80, so the
 * port-443 request was not pinned at all.
 */

afterEach(fn () => SafeUrlFetcher::resolveUsing(null));

/**
 * Fake the web: each URL maps to a status and an optional Location.
 *
 * @param  array<string, array{0: int, 1?: string}>  $routes
 */
function fakeRoutes(array $routes): void
{
    Http::fake(function (Request $request) use ($routes) {
        $route = $routes[$request->url()] ?? [404];
        $status = $route[0];
        $location = $route[1] ?? null;

        return Http::response('ok', $status, $location === null ? [] : ['Location' => $location]);
    });
}

it('refuses a redirect to a host that rebinds between the check and the hop, sending nothing to it', function () {
    $calls = [];
    SafeUrlFetcher::resolveUsing(function (string $host) use (&$calls): array {
        $calls[$host] = ($calls[$host] ?? 0) + 1;

        if ($host === 'rebind.example.net') {
            // Public to the check, the metadata address to the lookup that builds the pin.
            return $calls[$host] === 1 ? ['93.184.215.14'] : ['169.254.169.254'];
        }

        return ['93.184.215.14'];
    });
    fakeRoutes(['https://start.example.com/' => [302, 'https://rebind.example.net/admin']]);

    expect(fn () => (new SafeUrlFetcher)->fetch('https://start.example.com/'))
        ->toThrow(UnsafeUrlException::class);

    Http::assertSentCount(1);
    Http::assertNotSent(fn (Request $r): bool => str_contains($r->url(), 'rebind.example.net'));
});

it('pins the https port on a same-host http to https redirect', function () {
    SafeUrlFetcher::resolveUsing(fn (): array => ['93.184.215.14', '2606:2800:21f:cb07:6820:80da:af6b:8b2c']);
    fakeRoutes([
        'http://site.example.com/' => [301, 'https://site.example.com/'],
        'https://site.example.com/' => [200],
    ]);

    $fetcher = new SafeUrlFetcher;
    expect($fetcher->fetch('http://site.example.com/')->status())->toBe(200);

    $hops = $fetcher->hops();
    expect($hops)->toHaveCount(2)
        ->and($hops[0]['url'])->toBe('http://site.example.com/')
        ->and($hops[0]['curl'][CURLOPT_RESOLVE])->toBe(['site.example.com:80:93.184.215.14,[2606:2800:21f:cb07:6820:80da:af6b:8b2c]'])
        ->and($hops[1]['url'])->toBe('https://site.example.com/')
        ->and($hops[1]['curl'][CURLOPT_RESOLVE])->toBe(['site.example.com:443:93.184.215.14,[2606:2800:21f:cb07:6820:80da:af6b:8b2c]']);
});

it('pins a redirect to another host with that host\'s own addresses', function () {
    SafeUrlFetcher::resolveUsing(fn (string $host): array => $host === 'cdn.example.org' ? ['151.101.1.69'] : ['93.184.215.14']);
    fakeRoutes([
        'https://start.example.com/' => [302, 'https://cdn.example.org/page'],
        'https://cdn.example.org/page' => [200],
    ]);

    $fetcher = new SafeUrlFetcher;
    expect($fetcher->fetch('https://start.example.com/')->status())->toBe(200);

    expect($fetcher->hops()[1]['curl'][CURLOPT_RESOLVE])->toBe(['cdn.example.org:443:151.101.1.69']);
});

it('resolves a relative Location against the current URL', function (string $location, string $expected) {
    SafeUrlFetcher::resolveUsing(fn (): array => ['93.184.215.14']);
    fakeRoutes([
        'https://site.example.com/a/b' => [302, $location],
        $expected => [200],
    ]);

    $fetcher = new SafeUrlFetcher;
    expect($fetcher->fetch('https://site.example.com/a/b')->status())->toBe(200)
        ->and($fetcher->hops()[1]['url'])->toBe($expected);
})->with([
    'absolute path' => ['/next', 'https://site.example.com/next'],
    'relative path' => ['c?x=1', 'https://site.example.com/a/c?x=1'],
    'parent path' => ['../up', 'https://site.example.com/up'],
    'scheme-relative' => ['//other.example.com/z', 'https://other.example.com/z'],
]);

it('refuses a redirect to a non-http scheme without following it', function () {
    SafeUrlFetcher::resolveUsing(fn (): array => ['93.184.215.14']);
    fakeRoutes(['https://site.example.com/' => [302, 'file:///etc/passwd']]);

    expect(fn () => (new SafeUrlFetcher)->fetch('https://site.example.com/'))
        ->toThrow(UnsafeUrlException::class);

    Http::assertSentCount(1);
});

it('stops at the redirect limit', function () {
    SafeUrlFetcher::resolveUsing(fn (): array => ['93.184.215.14']);
    Http::fake(fn (Request $r) => Http::response('', 302, ['Location' => $r->url().'x']));

    try {
        (new SafeUrlFetcher(maxRedirects: 3))->fetch('https://loop.example.com/');
        $this->fail('expected the redirect limit to stop the fetch');
    } catch (FetchFailedException $e) {
        expect($e->phase)->toBe('http')
            ->and($e->getMessage())->toContain('too many redirects');
    }

    // The first request plus three followed redirects; the fourth is refused.
    Http::assertSentCount(4);
});

it('sends no Referer on a followed redirect', function () {
    SafeUrlFetcher::resolveUsing(fn (): array => ['93.184.215.14']);
    fakeRoutes([
        'https://site.example.com/' => [302, '/next'],
        'https://site.example.com/next' => [200],
    ]);

    (new SafeUrlFetcher)->fetch('https://site.example.com/');

    Http::assertSent(fn (Request $r): bool => $r->url() === 'https://site.example.com/next' && ! $r->hasHeader('Referer'));
});

it('returns a redirect without a Location as the response', function () {
    SafeUrlFetcher::resolveUsing(fn (): array => ['93.184.215.14']);
    fakeRoutes(['https://site.example.com/' => [302]]);

    expect((new SafeUrlFetcher)->fetch('https://site.example.com/')->status())->toBe(302);
    Http::assertSentCount(1);
});
