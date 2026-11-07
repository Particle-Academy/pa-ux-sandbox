<?php

use App\Jobs\ScanShowcaseSubmission;
use App\Models\AgentKey;
use App\Models\ShowcaseSubmission;
use App\Models\User;
use App\Services\Showcase\SafeUrlFetcher;
use App\Services\Showcase\SubmissionSnippets;
use Database\Seeders\FunLabSeeder;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

/*
 * "Verified" (listed in the public showcase) and "ownership-verified" (the
 * submitter has proved they control the project) are two different facts.
 *
 * Verified stays loose on purpose: any Fancy string on a homepage, or a
 * keyless badge in a README, lists the project. Ownership is the stronger
 * fact a support entitlement rests on, so it binds to THIS submission's
 * site_key — the key in the snippets SubmissionSnippets hands out — or to the
 * submitter's GitHub login owning the repo's namespace.
 *
 * Plan: .ai/plans/fancy-support.md section 1.1.
 */
beforeEach(function () {
    $this->seed(FunLabSeeder::class);
    SafeUrlFetcher::resolveUsing(fn (): array => ['93.184.216.34']);
});

afterEach(function () {
    SafeUrlFetcher::resolveUsing(null);
});

function ownWebsite(?User $user = null, string $url = 'https://owned-site.example'): ShowcaseSubmission
{
    return ShowcaseSubmission::create([
        'user_id' => ($user ?? User::factory()->create())->id,
        'kind' => 'website',
        'url' => $url,
        'status' => 'pending',
    ]);
}

function ownRepo(?User $user = null, string $url = 'https://github.com/acme/widget'): ShowcaseSubmission
{
    return ShowcaseSubmission::create([
        'user_id' => ($user ?? User::factory()->create())->id,
        'kind' => 'repo',
        'url' => $url,
        'status' => 'pending',
    ]);
}

function ownServeHomepage(string $html): void
{
    Http::fake(['*' => Http::response($html, 200)]);
}

/**
 * Fake the GitHub surface RepoVerifier reads. Two component files, both using
 * Fancy, so the usage bar (>=30%) always passes and only the badge varies.
 */
function ownFakeGithub(?string $readme): void
{
    $files = [
        'src/App.tsx' => "import { Button } from '@particle-academy/react-fancy';",
        'src/Home.tsx' => "import { Card } from '@particle-academy/react-fancy';",
    ];

    Http::fake([
        'api.github.com/repos/*/readme' => $readme === null
            ? Http::response('not found', 404)
            : Http::response(['content' => base64_encode($readme), 'encoding' => 'base64']),
        'api.github.com/repos/*/git/trees/*' => Http::response([
            'tree' => array_map(fn ($p) => ['path' => $p, 'type' => 'blob'], array_keys($files)),
        ]),
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
}

function ownBadge(string $siteKey): string
{
    $appUrl = rtrim((string) config('app.url'), '/');

    return "[![Fancified]({$appUrl}/badge/fancified.svg?site={$siteKey})](https://particle.academy)";
}

// ── Websites ─────────────────────────────────────────────────────────────────

it('proves ownership of a website that carries THIS submission\'s pixel snippet', function () {
    $submission = ownWebsite();
    $snippet = app(SubmissionSnippets::class)->pixelSnippet($submission);
    ownServeHomepage("<html><body>{$snippet}</body></html>");

    (new ScanShowcaseSubmission($submission))->handle();

    $submission->refresh();
    expect($submission->status)->toBe('verified')
        ->and($submission->ownership_method)->toBe('pixel_key')
        ->and($submission->ownership_verified_at)->not->toBeNull()
        ->and($submission->isOwnershipVerified())->toBeTrue();
});

it('lists a foreign site carrying Fancy strings but never gives it ownership', function () {
    // Everything the loose verifier accepts, and none of it this submission's key:
    // package strings, react-fancy attributes, the wordmark, a keyless loader.
    ownServeHomepage('<html><body>'
        .'<script src="https://unpkg.com/@particle-academy/fancy-pixel/dist/fancy-pixel.global.min.js"></script>'
        .'<script>import("@particle-academy/react-fancy")</script>'
        .'<div data-react-fancy-button>Powered by Fancy UI</div>'
        .'</body></html>');
    $submission = ownWebsite();

    (new ScanShowcaseSubmission($submission))->handle();

    $submission->refresh();
    // The public-listing behaviour is unchanged...
    expect($submission->status)->toBe('verified');
    // ...but nothing on that page is bound to this submission.
    expect($submission->ownership_verified_at)->toBeNull()
        ->and($submission->ownership_method)->toBeNull()
        ->and($submission->isOwnershipVerified())->toBeFalse();
});

it('never gives ownership to a site carrying ANOTHER submission\'s pixel key', function () {
    // The real owner registered first; their pixel is on the page.
    $owner = ownWebsite(url: 'https://victim.example');
    $ownerSnippet = app(SubmissionSnippets::class)->pixelSnippet($owner);
    ownServeHomepage("<html><body>{$ownerSnippet}</body></html>");

    // Someone else submits the same URL and gets a different key.
    $claimant = ownWebsite(url: 'https://victim.example');
    expect($claimant->site_key)->not->toBe($owner->site_key);

    (new ScanShowcaseSubmission($claimant))->handle();

    $claimant->refresh();
    expect($claimant->status)->toBe('verified')
        ->and($claimant->ownership_verified_at)->toBeNull()
        ->and($claimant->ownership_method)->toBeNull();
});

it('does not accept the key outside a real script tag, or as a prefix of a longer key', function () {
    $submission = ownWebsite();
    $key = $submission->site_key;

    // Escaped markup (a comment echoed back by the site) and a longer key that
    // merely STARTS with this one are both not this submission's pixel.
    ownServeHomepage('<html><body>'
        .'<p>&lt;script data-site="'.$key.'"&gt;&lt;/script&gt;</p>'
        .'<script src="https://unpkg.com/@particle-academy/fancy-pixel/dist/fancy-pixel.global.min.js" data-site="'.$key.'x"></script>'
        .'<p>data-site="'.$key.'"</p>'
        .'</body></html>');

    (new ScanShowcaseSubmission($submission))->handle();

    expect($submission->fresh()->ownership_verified_at)->toBeNull();
});

it('withdraws website ownership on a rescan once the pixel is gone', function () {
    $submission = ownWebsite();
    $snippet = app(SubmissionSnippets::class)->pixelSnippet($submission);
    // One fake whose body changes: a second Http::fake() call does not replace
    // the first stub, it queues behind it.
    $page = (object) ['html' => "<html><body>{$snippet}</body></html>"];
    Http::fake(['*' => fn () => Http::response($page->html, 200)]);

    (new ScanShowcaseSubmission($submission))->handle();
    expect($submission->fresh()->isOwnershipVerified())->toBeTrue();

    $page->html = '<html><body>@particle-academy/react-fancy</body></html>';
    (new ScanShowcaseSubmission($submission->fresh()))->handle();

    $submission->refresh();
    expect($submission->ownership_verified_at)->toBeNull()
        ->and($submission->ownership_method)->toBeNull();
});

it('keeps the first proof time while the proof keeps holding', function () {
    $submission = ownWebsite();
    $snippet = app(SubmissionSnippets::class)->pixelSnippet($submission);
    ownServeHomepage("<html><body>{$snippet}</body></html>");

    $this->travelTo(now()->subDay());
    (new ScanShowcaseSubmission($submission))->handle();
    $first = $submission->fresh()->ownership_verified_at;
    $this->travelBack();

    (new ScanShowcaseSubmission($submission->fresh()))->handle();

    expect($submission->fresh()->ownership_verified_at->equalTo($first))->toBeTrue();
});

// ── Repos ────────────────────────────────────────────────────────────────────

it('proves ownership of a repo whose README carries THIS submission\'s badge key', function () {
    $submission = ownRepo();
    ownFakeGithub("# Widget\n".ownBadge($submission->site_key)."\n");

    (new ScanShowcaseSubmission($submission))->handle();

    $submission->refresh();
    expect($submission->status)->toBe('verified')
        ->and($submission->ownership_method)->toBe('badge_key')
        ->and($submission->ownership_verified_at)->not->toBeNull();
});

it('lists a repo with a keyless badge but never gives it ownership', function () {
    $appUrl = rtrim((string) config('app.url'), '/');
    ownFakeGithub("# Widget\n[![Fancified]({$appUrl}/badge/fancified.svg)](https://particle.academy)\n");
    $submission = ownRepo();

    (new ScanShowcaseSubmission($submission))->handle();

    $submission->refresh();
    expect($submission->status)->toBe('verified')
        ->and($submission->ownership_verified_at)->toBeNull()
        ->and($submission->ownership_method)->toBeNull();
});

it('never gives repo ownership for a badge carrying ANOTHER submission\'s key', function () {
    $other = ownRepo(url: 'https://github.com/someone/else');
    $submission = ownRepo();
    $appUrl = rtrim((string) config('app.url'), '/');
    // Another key, plus a keyless mark: the old detector accepts this as a badge.
    ownFakeGithub("# Widget\n".ownBadge($other->site_key)."\n[![F]({$appUrl}/badge/fancified.svg)](x)\n");

    (new ScanShowcaseSubmission($submission))->handle();

    $submission->refresh();
    expect($submission->status)->toBe('verified')
        ->and($submission->ownership_verified_at)->toBeNull();
});

it('proves repo ownership when the submitter\'s GitHub login owns the namespace', function () {
    $user = User::factory()->create();
    $user->forceFill(['github_id' => '4242', 'github_username' => 'Acme'])->save();
    $appUrl = rtrim((string) config('app.url'), '/');
    ownFakeGithub("# Widget\n[![Fancified]({$appUrl}/badge/fancified.svg)](https://particle.academy)\n");
    $submission = ownRepo($user, 'https://github.com/acme/widget');

    (new ScanShowcaseSubmission($submission))->handle();

    $submission->refresh();
    expect($submission->ownership_method)->toBe('github_owner')
        ->and($submission->ownership_verified_at)->not->toBeNull();
});

it('records the GitHub-owner proof even when the README cannot be fetched', function () {
    $user = User::factory()->create();
    $user->forceFill(['github_id' => '4242', 'github_username' => 'acme'])->save();
    ownFakeGithub(null);
    $submission = ownRepo($user, 'https://github.com/acme/widget');

    (new ScanShowcaseSubmission($submission))->handle();

    $submission->refresh();
    expect($submission->status)->toBe('rejected')
        ->and($submission->ownership_method)->toBe('github_owner');
});

it('does not match a GitHub login that is not the namespace, or one not from GitHub sign-in', function () {
    $appUrl = rtrim((string) config('app.url'), '/');
    ownFakeGithub("# Widget\n[![Fancified]({$appUrl}/badge/fancified.svg)](https://particle.academy)\n");

    // A real GitHub login, but somebody else's namespace.
    $stranger = User::factory()->create();
    $stranger->forceFill(['github_id' => '1', 'github_username' => 'not-acme'])->save();
    $a = ownRepo($stranger, 'https://github.com/acme/widget');

    // The right name, but no github_id: it did not come from GitHub sign-in.
    $unlinked = User::factory()->create();
    $unlinked->forceFill(['github_id' => null, 'github_username' => 'acme'])->save();
    $b = ownRepo($unlinked, 'https://github.com/acme/widget');

    (new ScanShowcaseSubmission($a))->handle();
    (new ScanShowcaseSubmission($b))->handle();

    expect($a->fresh()->ownership_verified_at)->toBeNull()
        ->and($b->fresh()->ownership_verified_at)->toBeNull();
});

// ── The rescan tool ──────────────────────────────────────────────────────────

it('records ownership when an agent rescans through the MCP tool', function () {
    // QUEUE_CONNECTION is sync in the suite, so the dispatched scan runs inline.
    $user = User::factory()->create();
    ['plaintext' => $plaintext] = AgentKey::mint($user, 'Claude');
    $submission = ownWebsite($user);
    $snippet = app(SubmissionSnippets::class)->pixelSnippet($submission);
    ownServeHomepage("<html><body>{$snippet}</body></html>");

    $response = $this->postJson('/mcp', [
        'jsonrpc' => '2.0',
        'id' => 1,
        'method' => 'tools/call',
        'params' => [
            'name' => 'rescan-showcase-project',
            'arguments' => ['agent_key' => $plaintext, 'id' => $submission->id],
        ],
    ], ['Accept' => 'application/json, text/event-stream'])->json();

    expect($response['result']['isError'])->toBeFalse();
    expect($submission->fresh()->ownership_method)->toBe('pixel_key');
});

it('reports ownership in showcase-project-status', function () {
    $user = User::factory()->create();
    ['plaintext' => $plaintext] = AgentKey::mint($user, 'Claude');
    $submission = ownWebsite($user);
    $submission->forceFill(['ownership_verified_at' => now(), 'ownership_method' => 'pixel_key'])->save();

    $response = $this->postJson('/mcp', [
        'jsonrpc' => '2.0',
        'id' => 1,
        'method' => 'tools/call',
        'params' => [
            'name' => 'showcase-project-status',
            'arguments' => ['agent_key' => $plaintext, 'id' => $submission->id],
        ],
    ], ['Accept' => 'application/json, text/event-stream'])->json();

    $payload = json_decode($response['result']['content'][0]['text'], true);
    expect($payload['submission']['ownership']['verified'])->toBeTrue()
        ->and($payload['submission']['ownership']['method'])->toBe('pixel_key');
});
