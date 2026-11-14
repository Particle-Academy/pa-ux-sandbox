<?php

use App\Services\Showcase\FetchFailedException;
use App\Services\Showcase\SafeUrlFetcher;
use Symfony\Component\Process\Process;
use Tests\TestCase;

uses(TestCase::class);

/*
 * The response-size cap, against REAL curl.
 *
 * The fetcher used to pass 'max' => maxBytes to Guzzle, which is not a Guzzle
 * option, so nothing capped a response: a submitted site could stream an endless
 * body into the scanner until the timeout. Http::fake() never runs curl, so a cap
 * enforced in curl can only be shown against a real socket. The fixture server
 * writes the bytes by hand (tests/Fixtures/SizeCapServer/server.php), and its two
 * huge routes never end, so a fetcher that does not abort them times out here
 * instead of passing.
 *
 * The loopback fixture is reached through a test-only subclass that lets
 * 127.0.0.1 through the address guard. Everything else is the production path:
 * the host is resolved, pinned with CURLOPT_RESOLVE, and fetched by curl.
 */

beforeEach(function () {
    $probe = stream_socket_server('tcp://127.0.0.1:0');
    $this->port = (int) substr(strrchr((string) stream_socket_get_name($probe, false), ':'), 1);
    fclose($probe);

    $this->server = new Process([PHP_BINARY, base_path('tests/Fixtures/SizeCapServer/server.php'), (string) $this->port]);
    $this->server->start();
    $this->server->waitUntil(fn (string $type, string $out): bool => str_contains($out, 'ready'));

    SafeUrlFetcher::resolveUsing(fn (): array => ['127.0.0.1']);
});

afterEach(function () {
    SafeUrlFetcher::resolveUsing(null);
    $this->server->stop(0);
});

/** The production fetcher, with only the loopback refusal lifted for the fixture. */
function loopbackFetcher(int $maxBytes): SafeUrlFetcher
{
    return new class(timeout: 8, maxBytes: $maxBytes) extends SafeUrlFetcher
    {
        protected function isBlockedIp(string $ip): bool
        {
            return $ip !== '127.0.0.1' && parent::isBlockedIp($ip);
        }
    };
}

/**
 * @return array{0: FetchFailedException|null, 1: float}
 */
function fetchExpectingFailure(SafeUrlFetcher $fetcher, string $url): array
{
    $started = microtime(true);
    try {
        $fetcher->fetch($url);

        return [null, microtime(true) - $started];
    } catch (FetchFailedException $e) {
        return [$e, microtime(true) - $started];
    }
}

it('refuses a body whose Content-Length is over the cap, before reading it', function () {
    [$e, $seconds] = fetchExpectingFailure(loopbackFetcher(100_000), "http://cap.example.com:{$this->port}/declared-huge");

    expect($e)->toBeInstanceOf(FetchFailedException::class)
        ->and($e->phase)->toBe('http')
        ->and($e->getMessage())->toContain('response too large')
        // Refused on the declared length, not after the timeout.
        ->and($seconds)->toBeLessThan(4.0);
});

it('aborts a chunked body with no Content-Length once it passes the cap', function () {
    [$e, $seconds] = fetchExpectingFailure(loopbackFetcher(100_000), "http://cap.example.com:{$this->port}/chunked-huge");

    expect($e)->toBeInstanceOf(FetchFailedException::class)
        ->and($e->phase)->toBe('http')
        ->and($e->getMessage())->toContain('response too large')
        ->and($seconds)->toBeLessThan(4.0);
});

it('still fetches a body under the cap, through the pinned address', function () {
    $fetcher = loopbackFetcher(100_000);

    $response = $fetcher->fetch("http://cap.example.com:{$this->port}/small");

    expect($response->status())->toBe(200)
        ->and(strlen($response->body()))->toBe(1_000)
        ->and($fetcher->hops()[0]['curl'][CURLOPT_RESOLVE])->toBe(["cap.example.com:{$this->port}:127.0.0.1"]);
});

it('fetches a body exactly at the cap', function () {
    $response = loopbackFetcher(1_000)->fetch("http://cap.example.com:{$this->port}/small");

    expect(strlen($response->body()))->toBe(1_000);
});

it('refuses a body one byte over the cap', function () {
    [$e] = fetchExpectingFailure(loopbackFetcher(999), "http://cap.example.com:{$this->port}/small");

    expect($e)->toBeInstanceOf(FetchFailedException::class)
        ->and($e->getMessage())->toContain('response too large');
});
