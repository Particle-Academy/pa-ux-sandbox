<?php

use App\Jobs\ScanShowcaseSubmission;
use App\Models\ShowcaseSubmission;
use App\Models\SitePageShot;
use App\Models\User;
use App\Services\Showcase\RepoVerifier;
use Database\Seeders\FunLabSeeder;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

/*
 * The repo verification flow mirrors the website (pixel) flow:
 * registering NEVER blocks — it creates a PENDING submission and shows install
 * instructions. A repo is LISTED only when BOTH the Fancified badge is in the
 * README AND >=30% of its view/component files use a Fancy package.
 */

/** Build a fake recursive git tree response payload from a list of paths. */
function fakeTree(array $paths): array
{
    return [
        'tree' => array_map(fn ($p) => ['path' => $p, 'type' => 'blob'], $paths),
    ];
}

/**
 * Fake the full GitHub API surface RepoVerifier touches:
 *   - repo metadata (default_branch)
 *   - README (base64)
 *   - recursive tree
 *   - raw file contents (keyed by path → body)
 *
 * @param  array<string, string>  $files  path => file body
 */
function fakeGithub(string $readme, array $files): void
{
    $appUrl = rtrim((string) config('app.url'), '/');

    Http::fake([
        'api.github.com/repos/*/readme' => Http::response([
            'content' => base64_encode($readme),
            'encoding' => 'base64',
        ]),
        'api.github.com/repos/*/git/trees/*' => Http::response(fakeTree(array_keys($files))),
        'api.github.com/repos/*' => Http::response(['default_branch' => 'main']),
        'raw.githubusercontent.com/*' => function ($request) use ($files) {
            foreach ($files as $path => $body) {
                if (str_ends_with(rawurldecode($request->url()), '/'.$path)) {
                    return Http::response($body);
                }
            }

            return Http::response('not found', 404);
        },
    ]);

    // Quiet the unused var lint; the app URL is what the badge markdown embeds.
    unset($appUrl);
}

it('registers a repo submission as pending without blocking', function () {
    Bus::fake();
    $this->actingAs(User::factory()->create());

    $response = $this->post('/showcase/submit', [
        'kind' => 'repo',
        'url' => 'https://github.com/acme/widget',
    ]);

    $submission = ShowcaseSubmission::query()->where('kind', 'repo')->first();
    expect($submission)->not->toBeNull();
    expect($submission->status)->toBe('pending');
    $response->assertRedirect(route('showcase.showcase.installed', $submission));
    Bus::assertDispatched(ScanShowcaseSubmission::class);
});

it('exposes the Fancified badge markdown carrying the site_key on the install page', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $submission = ShowcaseSubmission::create([
        'user_id' => $user->id,
        'kind' => 'repo',
        'url' => 'https://github.com/acme/widget',
        'status' => 'pending',
    ]);

    $response = $this->get(route('showcase.showcase.installed', $submission));
    $response->assertOk();

    $response->assertInertia(
        fn ($page) => $page
            ->component('Showcase/Installed')
            ->where('submission.kind', 'repo')
            ->where('snippet', null)
            ->where('badgeMarkdown', fn ($md) => str_contains($md, '/badge/fancified.svg?site='.$submission->site_key)
                && str_contains($md, '[![Fancified]')
            )
    );
});

it('verifies a repo when the README has the badge AND Fancy usage >=30%', function () {
    $user = User::factory()->create();
    $submission = ShowcaseSubmission::create([
        'user_id' => $user->id,
        'kind' => 'repo',
        'url' => 'https://github.com/acme/widget',
        'status' => 'pending',
    ]);

    $appUrl = rtrim((string) config('app.url'), '/');
    $readme = "# Widget\n[![Fancified]({$appUrl}/badge/fancified.svg?site={$submission->site_key})](https://particle.academy)\n";

    // 4 component files; 2 use Fancy → 50% (>=30%).
    fakeGithub($readme, [
        'src/App.tsx' => "import { Button } from '@particle-academy/react-fancy';",
        'src/Home.tsx' => "import { Card } from '@particle-academy/react-fancy';",
        'src/Plain.tsx' => 'export const Plain = () => null;',
        'src/Other.jsx' => 'export const Other = () => null;',
    ]);

    $result = app(RepoVerifier::class)->verify($submission);

    expect($result['verified'])->toBeTrue();
    expect($result['badge'])->toBeTrue();
    expect($result['usage_ratio'])->toBe(0.5);
    expect($result['files_scanned'])->toBe(4);
    expect($result['fancy_files'])->toBe(2);
});

it('does NOT verify a repo when the badge is missing (even with high Fancy usage)', function () {
    $user = User::factory()->create();
    $submission = ShowcaseSubmission::create([
        'user_id' => $user->id,
        'kind' => 'repo',
        'url' => 'https://github.com/acme/widget',
        'status' => 'pending',
    ]);

    $readme = "# Widget\nNo badge here.\n";

    fakeGithub($readme, [
        'src/App.tsx' => "import { Button } from '@particle-academy/react-fancy';",
        'src/Home.tsx' => "import { Card } from '@particle-academy/react-fancy';",
    ]);

    $result = app(RepoVerifier::class)->verify($submission);

    expect($result['verified'])->toBeFalse();
    expect($result['badge'])->toBeFalse();
    expect($result['reason'])->toContain('badge');
});

it('does NOT verify a repo when Fancy usage is below 30% (even with the badge)', function () {
    $user = User::factory()->create();
    $submission = ShowcaseSubmission::create([
        'user_id' => $user->id,
        'kind' => 'repo',
        'url' => 'https://github.com/acme/widget',
        'status' => 'pending',
    ]);

    $appUrl = rtrim((string) config('app.url'), '/');
    $readme = "# Widget\n[![Fancified]({$appUrl}/badge/fancified.svg?site={$submission->site_key})](https://particle.academy)\n";

    // 5 component files; only 1 uses Fancy → 20% (<30%).
    fakeGithub($readme, [
        'src/App.tsx' => "import { Button } from '@particle-academy/react-fancy';",
        'src/A.tsx' => 'export const A = () => null;',
        'src/B.tsx' => 'export const B = () => null;',
        'src/C.tsx' => 'export const C = () => null;',
        'src/D.tsx' => 'export const D = () => null;',
    ]);

    $result = app(RepoVerifier::class)->verify($submission);

    expect($result['verified'])->toBeFalse();
    expect($result['badge'])->toBeTrue();
    expect($result['usage_ratio'])->toBe(0.2);
    expect($result['reason'])->toContain('30%');
});

it('counts blade.php views as component files', function () {
    $user = User::factory()->create();
    $submission = ShowcaseSubmission::create([
        'user_id' => $user->id,
        'kind' => 'repo',
        'url' => 'https://github.com/acme/widget',
        'status' => 'pending',
    ]);

    $appUrl = rtrim((string) config('app.url'), '/');
    $readme = "[![Fancified]({$appUrl}/badge/fancified.svg?site={$submission->site_key})](https://particle.academy)";

    // Blade view referencing the PHP namespace → counts as Fancy usage.
    fakeGithub($readme, [
        'resources/views/home.blade.php' => '@php use particle-academy/fancy-cms; @endphp',
        'resources/views/about.blade.php' => '<div>plain</div>',
    ]);

    $result = app(RepoVerifier::class)->verify($submission);

    expect($result['files_scanned'])->toBe(2);
    expect($result['fancy_files'])->toBe(1);
    expect($result['usage_ratio'])->toBe(0.5);
    expect($result['verified'])->toBeTrue();
});

it('flips a repo submission to verified through the async job', function () {
    $this->seed(FunLabSeeder::class);
    $user = User::factory()->create();
    $submission = ShowcaseSubmission::create([
        'user_id' => $user->id,
        'kind' => 'repo',
        'url' => 'https://github.com/acme/widget',
        'status' => 'pending',
    ]);

    $appUrl = rtrim((string) config('app.url'), '/');
    $readme = "[![Fancified]({$appUrl}/badge/fancified.svg?site={$submission->site_key})](https://particle.academy)";

    fakeGithub($readme, [
        'src/App.tsx' => "import { Button } from '@particle-academy/react-fancy';",
        'src/Home.tsx' => "import { Card } from '@particle-academy/react-fancy';",
    ]);

    (new ScanShowcaseSubmission($submission))->handle();

    $submission->refresh();
    expect($submission->status)->toBe('verified');
    expect($submission->scan_result['passed'])->toBeTrue();
});

it('keeps a repo pending (rejected status) when verification fails', function () {
    $user = User::factory()->create();
    $submission = ShowcaseSubmission::create([
        'user_id' => $user->id,
        'kind' => 'repo',
        'url' => 'https://github.com/acme/widget',
        'status' => 'pending',
    ]);

    fakeGithub('# No badge', [
        'src/App.tsx' => "import { Button } from '@particle-academy/react-fancy';",
    ]);

    (new ScanShowcaseSubmission($submission))->handle();

    $submission->refresh();
    expect($submission->status)->not->toBe('verified');
    expect($submission->scan_result['verified'])->toBeFalse();
});

it('handles a missing/private repo gracefully (not verified, with a reason)', function () {
    $user = User::factory()->create();
    $submission = ShowcaseSubmission::create([
        'user_id' => $user->id,
        'kind' => 'repo',
        'url' => 'https://github.com/ghost/missing',
        'status' => 'pending',
    ]);

    Http::fake([
        'api.github.com/*' => Http::response(['message' => 'Not Found'], 404),
        'raw.githubusercontent.com/*' => Http::response('not found', 404),
    ]);

    $result = app(RepoVerifier::class)->verify($submission);

    expect($result['verified'])->toBeFalse();
    expect($result['reason'])->not->toBeEmpty();
});

it('serves the Fancified badge SVG with the right content type', function () {
    $response = $this->get('/badge/fancified.svg?site=abc123');

    $response->assertOk();
    $response->assertHeader('Content-Type', 'image/svg+xml');
    expect($response->getContent())->toContain('Fancified');
});

it('lists only verified repos on the public showcase index', function () {
    $user = User::factory()->create();

    ShowcaseSubmission::create([
        'user_id' => $user->id,
        'kind' => 'repo',
        'url' => 'https://github.com/acme/pending-repo',
        'title' => 'Pending Repo',
        'status' => 'pending',
    ]);
    ShowcaseSubmission::create([
        'user_id' => $user->id,
        'kind' => 'repo',
        'url' => 'https://github.com/acme/verified-repo',
        'title' => 'Verified Repo',
        'status' => 'verified',
    ]);

    $response = $this->get('/showcase');
    $response->assertOk();

    $response->assertInertia(
        fn ($page) => $page
            ->component('Showcase/Index')
            ->has('submissions', 1)
            ->where('submissions.0.url', 'https://github.com/acme/verified-repo')
    );
});

it('uses the captured homepage screenshot as the showcase thumbnail', function () {
    $user = User::factory()->create();
    $site = ShowcaseSubmission::create([
        'user_id' => $user->id,
        'kind' => 'website',
        'url' => 'https://acme.example',
        'title' => 'Acme',
        'status' => 'verified',
    ]);
    // A captured shot (same source the analytics heatmap uses) — not the dead
    // thumbnail_url column.
    SitePageShot::create([
        'site_key' => $site->site_key,
        'path' => '/',
        'image_path' => 'heatmaps/acme/home.png',
        'vw' => 1440, 'vh' => 900, 'captured_at' => now(),
    ]);

    $this->get('/showcase')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Showcase/Index')
            ->where('submissions.0.thumbnail_url', '/storage/heatmaps/acme/home.png')
        );
});
