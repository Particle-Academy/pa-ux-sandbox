<?php

use App\Jobs\ScanShowcaseSubmission;
use App\Models\ShowcaseSubmission;
use App\Models\User;
use App\Services\Showcase\FetchFailedException;
use App\Services\Showcase\SafeUrlFetcher;
use App\Services\Showcase\UnsafeUrlException;
use Database\Seeders\FunLabSeeder;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

/*
 * How the fetcher pins the addresses it validated, and how it reports a failed fetch.
 *
 * The old fetcher wrote one CURLOPT_RESOLVE entry PER address. libcurl keeps only the
 * last entry for a host:port ("RESOLVE host:port - old addresses discarded", measured
 * on curl 8.23.0), and dns_get_record lists A before AAAA, so a dual-stack site was
 * pinned to its last AAAA alone. On a host whose IPv6 egress is broken, every
 * dual-stack site then spent the whole 10 s connect budget on one IPv6 address and
 * never tried IPv4. That is how bridge.fow.today failed verification with
 * "cURL error 28: Connection timed out after 10002 ms" while answering in 21 ms over
 * IPv4 from elsewhere.
 */

const DUAL_STACK = ['2606:4700:3030::ac43:928d', '172.67.146.141', '2606:4700:3030::6815:2968', '104.21.41.104'];

afterEach(fn () => SafeUrlFetcher::resolveUsing(null));

/** A fetcher whose curl options can be read without sending anything. */
function probeFetcher(): SafeUrlFetcher
{
    return new class extends SafeUrlFetcher
    {
        /** @return array<int, mixed> */
        public function optionsFor(string $url): array
        {
            return $this->pinnedResolveOptions($url);
        }
    };
}

it('pins every address of a host:port in ONE resolve entry, IPv4 first', function () {
    SafeUrlFetcher::resolveUsing(fn (): array => DUAL_STACK);

    $options = probeFetcher()->optionsFor('https://submitted.example.com/');

    // One entry: curl discards every earlier entry for the same host:port.
    expect($options[CURLOPT_RESOLVE])->toBe([
        'submitted.example.com:443:172.67.146.141,104.21.41.104,[2606:4700:3030::ac43:928d],[2606:4700:3030::6815:2968]',
    ])
        // Both families stay pinned, so curl's happy-eyeballs can fall back to IPv6.
        ->and($options)->not->toHaveKey(CURLOPT_IPRESOLVE);
});

it('pins the explicit port of the URL', function () {
    SafeUrlFetcher::resolveUsing(fn (): array => ['93.184.215.14', '2606:2800:21f:cb07:6820:80da:af6b:8b2c']);

    expect(probeFetcher()->optionsFor('http://submitted.example.com:8080/x')[CURLOPT_RESOLVE])
        ->toBe(['submitted.example.com:8080:93.184.215.14,[2606:2800:21f:cb07:6820:80da:af6b:8b2c]']);
});

it('pins IPv4 only, and tells curl so, when configured ipv4-only and an A record exists', function () {
    config()->set('services.showcase_fetcher.ip_family', 'ipv4-only');
    SafeUrlFetcher::resolveUsing(fn (): array => DUAL_STACK);

    $options = probeFetcher()->optionsFor('https://submitted.example.com/');

    expect($options[CURLOPT_RESOLVE])->toBe(['submitted.example.com:443:172.67.146.141,104.21.41.104'])
        ->and($options[CURLOPT_IPRESOLVE])->toBe(CURL_IPRESOLVE_V4);
});

it('still reaches an IPv6-only host when configured ipv4-only', function () {
    config()->set('services.showcase_fetcher.ip_family', 'ipv4-only');
    SafeUrlFetcher::resolveUsing(fn (): array => ['2606:2800:21f:cb07:6820:80da:af6b:8b2c']);

    $options = probeFetcher()->optionsFor('https://submitted.example.com/');

    expect($options[CURLOPT_RESOLVE])->toBe(['submitted.example.com:443:[2606:2800:21f:cb07:6820:80da:af6b:8b2c]'])
        ->and($options)->not->toHaveKey(CURLOPT_IPRESOLVE);
});

it('keeps the resolver order when configured resolver-order', function () {
    config()->set('services.showcase_fetcher.ip_family', 'resolver-order');
    SafeUrlFetcher::resolveUsing(fn (): array => DUAL_STACK);

    expect(probeFetcher()->optionsFor('https://submitted.example.com/')[CURLOPT_RESOLVE])->toBe([
        'submitted.example.com:443:[2606:4700:3030::ac43:928d],172.67.146.141,[2606:4700:3030::6815:2968],104.21.41.104',
    ]);
});

it('validates an address it then leaves out of the pin', function (string $family) {
    // ipv4-only drops the AAAA from the pin, but a blocked AAAA must still refuse
    // the whole host: the host is not safe just because we chose not to dial it.
    config()->set('services.showcase_fetcher.ip_family', $family);
    SafeUrlFetcher::resolveUsing(fn (): array => ['172.67.146.141', 'fd12:3456::1']);

    expect(fn () => probeFetcher()->optionsFor('https://submitted.example.com/'))
        ->toThrow(UnsafeUrlException::class);
})->with(['prefer-ipv4', 'ipv4-only', 'resolver-order']);

it('refuses a host that rebinds to an internal address between the check and the pin', function (string $family, string $rebound) {
    config()->set('services.showcase_fetcher.ip_family', $family);
    Http::fake();

    $calls = 0;
    SafeUrlFetcher::resolveUsing(function () use (&$calls, $rebound): array {
        $calls++;

        // The check sees a public address; the lookup that builds the pin sees the rebind.
        return $calls === 1 ? ['93.184.215.14'] : ['93.184.215.14', $rebound];
    });

    expect(fn () => (new SafeUrlFetcher)->fetch('https://rebind.example.com/'))
        ->toThrow(UnsafeUrlException::class);

    expect($calls)->toBe(2);
    Http::assertNothingSent();
})->with([
    'prefer-ipv4 to metadata' => ['prefer-ipv4', '169.254.169.254'],
    'ipv4-only to an IPv6 ULA' => ['ipv4-only', 'fd00::1'],
    'resolver-order to loopback' => ['resolver-order', '127.0.0.1'],
]);

it('names the connect phase and the address families in a connect failure', function () {
    SafeUrlFetcher::resolveUsing(fn (): array => DUAL_STACK);
    Http::fake(['*' => Http::failedConnection(
        'cURL error 28: Connection timed out after 10002 ms (see https://curl.haxx.se/libcurl/c/libcurl-errors.html)',
    )]);

    try {
        (new SafeUrlFetcher)->fetch('https://bridge.example.com/');
        $this->fail('expected the fetch to fail');
    } catch (FetchFailedException $e) {
        expect($e->phase)->toBe('connect')
            ->and($e->getMessage())->toContain('connect phase')
            ->and($e->getMessage())->toContain('IPv4 first')
            ->and($e->getMessage())->toContain('2 IPv4 + 2 IPv6')
            ->and($e->getMessage())->toContain('cURL error 28: Connection timed out after 10002 ms');
    }
});

it('names IPv4 alone when ipv4-only kept curl off IPv6', function () {
    config()->set('services.showcase_fetcher.ip_family', 'ipv4-only');
    SafeUrlFetcher::resolveUsing(fn (): array => DUAL_STACK);
    Http::fake(['*' => Http::failedConnection('cURL error 7: Failed to connect to bridge.example.com port 443')]);

    try {
        (new SafeUrlFetcher)->fetch('https://bridge.example.com/');
        $this->fail('expected the fetch to fail');
    } catch (FetchFailedException $e) {
        expect($e->phase)->toBe('connect')
            ->and($e->family)->toBe('IPv4')
            ->and($e->getMessage())->toContain('over IPv4');
    }
});

it('reads a timeout after the connection was made as the HTTP phase', function () {
    SafeUrlFetcher::resolveUsing(fn (): array => ['93.184.215.14']);
    Http::fake(['*' => Http::failedConnection('cURL error 28: Operation timed out after 10001 milliseconds with 0 bytes received')]);

    try {
        (new SafeUrlFetcher)->fetch('https://slow.example.com/');
        $this->fail('expected the fetch to fail');
    } catch (FetchFailedException $e) {
        expect($e->phase)->toBe('http')
            ->and($e->getMessage())->toContain('HTTP phase')
            ->and($e->getMessage())->toContain('over IPv4');
    }
});

it('records the phase and family in the scan reason', function () {
    $this->seed(FunLabSeeder::class);
    SafeUrlFetcher::resolveUsing(fn (): array => DUAL_STACK);
    Http::fake(['*' => Http::failedConnection('cURL error 28: Connection timed out after 10002 ms')]);

    $submission = ShowcaseSubmission::create([
        'user_id' => User::factory()->create()->id,
        'kind' => 'website',
        'url' => 'https://bridge.example.com',
        'status' => 'pending',
    ]);

    (new ScanShowcaseSubmission($submission))->handle();

    $reason = $submission->fresh()->scan_result['reason'];
    expect($reason)->toStartWith('fetch failed: connect phase')
        ->and($reason)->toContain('IPv4 first');
});

it('says a non-2xx answer failed in the HTTP phase', function () {
    $this->seed(FunLabSeeder::class);
    SafeUrlFetcher::resolveUsing(fn (): array => ['93.184.215.14']);
    Http::fake(['*' => Http::response('nope', 503)]);

    $submission = ShowcaseSubmission::create([
        'user_id' => User::factory()->create()->id,
        'kind' => 'website',
        'url' => 'https://down.example.com',
        'status' => 'pending',
    ]);

    (new ScanShowcaseSubmission($submission))->handle();

    expect($submission->fresh()->scan_result['reason'])->toStartWith('HTTP 503 (HTTP phase');
});
