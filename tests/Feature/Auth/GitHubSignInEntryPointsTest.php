<?php

use App\Http\Middleware\HandleInertiaRequests;
use Tests\TestCase;

uses(TestCase::class);

/*
 * Every "Sign in with GitHub" entry point must end in a FULL page navigation.
 *
 * GitHub's consent screen is cross-origin, so an Inertia visit (an XHR) that
 * reaches it is blocked by CORS and the click does nothing. Two ways that
 * happened on this site before 2026-11-17:
 *
 * - "View analytics" on /showcase is an Inertia <Link> to an auth-only page. A
 *   guest's XHR followed the auth redirect to /login, which answered HTML, so
 *   Inertia showed the whole login page in its error modal. The GitHub button
 *   inside that modal did nothing and the page looked frozen.
 * - The phone bottom bar's Sign in was `<MobileMenu.Item as={Link} href="/auth/github">`.
 *
 * The server half is pinned here; the client half is a scan of the source, so
 * a new entry point written as an Inertia link fails the suite rather than
 * shipping.
 */

function entryPointInertiaHeaders(): array
{
    return [
        'X-Inertia' => 'true',
        'X-Requested-With' => 'XMLHttpRequest',
        'X-Inertia-Version' => (string) app(HandleInertiaRequests::class)->version(request()),
    ];
}

it('turns a guest Inertia visit to an auth-only page into a full-page trip to /login', function (string $uri) {
    // The XHR follows the redirect with its headers, as a browser does for a
    // same-origin redirect.
    $this->get($uri, entryPointInertiaHeaders())->assertRedirect('/login');

    $this->get('/login', entryPointInertiaHeaders())
        ->assertStatus(409)
        ->assertHeader('X-Inertia-Location', route('login'));
})->with([
    'View analytics' => '/analytics',
    'Referrals' => '/referrals',
]);

it('links every GitHub sign-in on /login as a plain anchor', function () {
    $html = $this->get('/login')->assertOk()->getContent();

    expect($html)->toContain('href="'.route('auth.github').'"')
        ->and($html)->not->toContain('data-inertia')
        ->and($html)->not->toMatch('/<form[^>]+action="[^"]*auth\/github/');
});

/**
 * Every client file that mentions the GitHub sign-in route.
 *
 * @return array<string, string> path => contents
 */
function filesNamingGitHubSignIn(): array
{
    $root = base_path('resources/js');
    $out = [];
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));
    foreach ($it as $file) {
        if (! preg_match('/\.(tsx?|jsx?)$/', $file->getFilename())) {
            continue;
        }
        $src = file_get_contents($file->getPathname());
        if (str_contains($src, '/auth/github')) {
            $out[substr($file->getPathname(), strlen(base_path()) + 1)] = $src;
        }
    }

    return $out;
}

it('finds the client entry points it guards (the scan is not looking at nothing)', function () {
    // Layout (header, footer, phone bottom bar, flyout), /showcase, /dreaming,
    // /subscriptions, /referrals/join and the catalog demo all name the route.
    expect(count(filesNamingGitHubSignIn()))->toBeGreaterThanOrEqual(5);
});

it('never reaches /auth/github through an Inertia Link or router visit', function () {
    $offenders = [];

    foreach (filesNamingGitHubSignIn() as $path => $src) {
        // A router call straight at the route.
        if (preg_match_all('/router\s*\.\s*(visit|get|post|reload)\s*\(\s*[`"\']\/auth\/github/', $src, $m, PREG_OFFSET_CAPTURE)) {
            foreach ($m[0] as [$hit, $offset]) {
                $offenders[] = $path.':'.(substr_count(substr($src, 0, $offset), "\n") + 1).' '.$hit;
            }
        }

        // A JSX element whose opening tag carries the route: it must not be a
        // <Link> or render `as={Link}`.
        $pos = 0;
        while (($at = strpos($src, '/auth/github', $pos)) !== false) {
            $pos = $at + 1;
            $open = strrpos(substr($src, 0, $at), '<');
            $close = strpos($src, '>', $at);
            if ($open === false || $close === false) {
                continue;
            }
            $tag = substr($src, $open, $close - $open + 1);
            if (! str_contains($tag, 'href')) {
                continue; // not an element attribute (a string in code)
            }
            if (preg_match('/^<Link\b/', $tag) || preg_match('/\bas=\{\s*Link\s*\}/', $tag)) {
                $offenders[] = $path.':'.(substr_count(substr($src, 0, $at), "\n") + 1).' '.preg_replace('/\s+/', ' ', $tag);
            }
        }
    }

    expect($offenders)->toBe([], "GitHub sign-in reached through an Inertia visit (CORS kills it):\n".implode("\n", $offenders));
});
