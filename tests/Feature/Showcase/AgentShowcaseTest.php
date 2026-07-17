<?php

use App\Jobs\ScanShowcaseSubmission;
use App\Models\AgentKey;
use App\Models\ShowcaseSubmission;
use App\Models\User;
use App\Services\Showcase\FancyPackageResolver;
use App\Services\Showcase\SafeUrlFetcher;
use Database\Seeders\FunLabSeeder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

uses(TestCase::class);

/**
 * The agent-facing showcase surface: users mint revocable agent access keys;
 * agents present them to the showcase MCP tools to register + verify projects
 * on the user's behalf; every scan records the Fancy packages the project
 * uses, normalized + linked to the registry.
 */
beforeEach(function () {
    $this->seed(FunLabSeeder::class);
    SafeUrlFetcher::resolveUsing(fn (): array => ['93.184.216.34']);
});

afterEach(function () {
    SafeUrlFetcher::resolveUsing(null);
});

function agentRpc(array $body): array
{
    return test()->postJson('/mcp', $body, [
        'Accept' => 'application/json, text/event-stream',
    ])->json();
}

function agentToolCall(string $tool, array $arguments): array
{
    $body = agentRpc([
        'jsonrpc' => '2.0',
        'id' => 1,
        'method' => 'tools/call',
        'params' => ['name' => $tool, 'arguments' => $arguments],
    ]);

    $payload = json_decode($body['result']['content'][0]['text'] ?? 'null', true);

    return ['isError' => $body['result']['isError'], 'payload' => $payload, 'raw' => $body];
}

function mintedKey(?User $user = null): array
{
    return AgentKey::mint($user ?? User::factory()->create(), 'Claude');
}

// ── Agent keys (web) ────────────────────────────────────────────────────────

it('mints an agent key and flashes the plaintext once', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/showcase/agent-keys', ['name' => 'Claude Code']);

    $response->assertRedirect(route('showcase.showcase.mine'));
    $plaintext = session('agent_key_plaintext');
    expect($plaintext)->toStartWith(AgentKey::PREFIX);

    $key = AgentKey::query()->where('user_id', $user->id)->sole();
    expect($key->name)->toBe('Claude Code');
    expect($key->token_hash)->toBe(hash('sha256', $plaintext));
    expect(AgentKey::resolve($plaintext)?->id)->toBe($key->id);
});

it('revokes an agent key (and resolution stops)', function () {
    $user = User::factory()->create();
    ['key' => $key, 'plaintext' => $plaintext] = mintedKey($user);

    $this->actingAs($user)->delete("/showcase/agent-keys/{$key->id}")->assertRedirect();

    expect($key->fresh()->isRevoked())->toBeTrue();
    expect(AgentKey::resolve($plaintext))->toBeNull();
});

it("cannot revoke another user's key", function () {
    ['key' => $key] = mintedKey();

    $this->actingAs(User::factory()->create())
        ->delete("/showcase/agent-keys/{$key->id}")
        ->assertForbidden();

    expect($key->fresh()->isRevoked())->toBeFalse();
});

it('lists agent keys on the mine page', function () {
    $user = User::factory()->create();
    mintedKey($user);

    $this->actingAs($user)->get('/showcase/mine')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Showcase/Mine')
            ->has('agentKeys', 1)
            ->where('agentKeys.0.name', 'Claude'));
});

// ── MCP: register ───────────────────────────────────────────────────────────

it('registers a project via the MCP tool, attributed to the key and its user', function () {
    Queue::fake();
    $user = User::factory()->create();
    ['plaintext' => $plaintext] = mintedKey($user);

    $result = agentToolCall('register-showcase-project', [
        'agent_key' => $plaintext,
        'kind' => 'website',
        'url' => 'https://built-with-fancy.example',
        'title' => 'Fancy Build',
        'category' => 'developer-tools',
    ]);

    expect($result['isError'])->toBeFalse();
    expect($result['payload']['registered'])->toBeTrue();
    expect($result['payload']['submission']['verification']['pixel_snippet'])->toContain('fancy-pixel');

    $submission = ShowcaseSubmission::query()->where('user_id', $user->id)->sole();
    expect($submission->status)->toBe('pending');
    expect($submission->registered_via)->toBe('agent');
    expect($submission->agent_name)->toBe('Claude');

    Queue::assertPushed(ScanShowcaseSubmission::class);
});

it('is idempotent per url — re-registering returns the existing entry', function () {
    Queue::fake();
    $user = User::factory()->create();
    ['plaintext' => $plaintext] = mintedKey($user);
    $args = ['agent_key' => $plaintext, 'kind' => 'website', 'url' => 'https://built-with-fancy.example'];

    agentToolCall('register-showcase-project', $args);
    $second = agentToolCall('register-showcase-project', $args);

    expect($second['isError'])->toBeFalse();
    expect($second['payload']['already_registered'])->toBeTrue();
    expect(ShowcaseSubmission::query()->where('user_id', $user->id)->count())->toBe(1);
});

it('rejects an invalid or revoked agent key', function () {
    $result = agentToolCall('register-showcase-project', [
        'agent_key' => 'fancy_agent_bogus',
        'kind' => 'website',
        'url' => 'https://built-with-fancy.example',
    ]);

    expect($result['isError'])->toBeTrue();
});

it('validates with the same rules as the web flow', function () {
    ['plaintext' => $plaintext] = mintedKey();

    $result = agentToolCall('register-showcase-project', [
        'agent_key' => $plaintext,
        'kind' => 'gopher-hole',
        'url' => 'not-a-url',
    ]);

    expect($result['isError'])->toBeTrue();
});

// ── MCP: status + rescan ────────────────────────────────────────────────────

it('reports status including registry-linked packages', function () {
    $user = User::factory()->create();
    ['plaintext' => $plaintext] = mintedKey($user);

    $submission = ShowcaseSubmission::create([
        'user_id' => $user->id,
        'kind' => 'website',
        'url' => 'https://built-with-fancy.example',
        'status' => 'verified',
        'packages' => app(FancyPackageResolver::class)->resolve(['@particle-academy/react-fancy']),
    ]);

    $result = agentToolCall('showcase-project-status', [
        'agent_key' => $plaintext,
        'id' => $submission->id,
    ]);

    expect($result['isError'])->toBeFalse();
    $packages = $result['payload']['submission']['packages'];
    expect($packages[0]['name'])->toBe('@particle-academy/react-fancy');
    expect($packages[0]['slug'])->toBe('react-fancy');
    expect($packages[0]['registry_url'])->toContain('/packages/react-fancy');
});

it("never exposes another user's submission", function () {
    ['plaintext' => $plaintext] = mintedKey();
    $other = ShowcaseSubmission::create([
        'user_id' => User::factory()->create()->id,
        'kind' => 'website',
        'url' => 'https://someone-elses.example',
        'status' => 'verified',
    ]);

    $result = agentToolCall('showcase-project-status', [
        'agent_key' => $plaintext,
        'id' => $other->id,
    ]);

    expect($result['isError'])->toBeTrue();
});

it('rescans an owned submission and rate limits the tool', function () {
    Queue::fake();
    $user = User::factory()->create();
    ['plaintext' => $plaintext] = mintedKey($user);
    $submission = ShowcaseSubmission::create([
        'user_id' => $user->id,
        'kind' => 'website',
        'url' => 'https://built-with-fancy.example',
        'status' => 'pending',
    ]);

    foreach (range(1, 3) as $i) {
        $ok = agentToolCall('rescan-showcase-project', ['agent_key' => $plaintext, 'id' => $submission->id]);
        expect($ok['isError'])->toBeFalse();
    }
    Queue::assertPushed(ScanShowcaseSubmission::class, 3);

    $limited = agentToolCall('rescan-showcase-project', ['agent_key' => $plaintext, 'id' => $submission->id]);
    expect($limited['isError'])->toBeTrue();
});

// ── Package detection + linking ─────────────────────────────────────────────

it('records registry-linked packages when a website scan verifies', function () {
    $submission = ShowcaseSubmission::create([
        'user_id' => User::factory()->create()->id,
        'kind' => 'website',
        'url' => 'https://built-with-fancy.example',
        'status' => 'pending',
    ]);

    Http::fake([
        'built-with-fancy.example' => Http::response(
            '<html><head><title>Fancy Build</title></head><body>'
            .'<script src="https://unpkg.com/@particle-academy/fancy-pixel/dist/fancy-pixel.global.min.js" data-site="'.$submission->site_key.'"></script>'
            .'<script>import("@particle-academy/react-fancy");import("@particle-academy/fancy-flow");</script>'
            .'</body></html>',
        ),
    ]);

    (new ScanShowcaseSubmission($submission))->handle();

    $submission->refresh();
    expect($submission->status)->toBe('verified');

    $bySlug = collect($submission->packages)->keyBy('slug');
    expect($bySlug->has('react-fancy'))->toBeTrue();
    expect($bySlug->has('fancy-flow'))->toBeTrue();
    expect($bySlug->get('react-fancy')['registry_url'])->toContain('/packages/react-fancy');
    // fancy-pixel appears in the embed and is recorded too.
    expect(collect($submission->packages)->pluck('name'))->toContain('@particle-academy/fancy-pixel');
});

it('normalizes and links both npm and composer forms to one registry entry', function () {
    $resolver = app(FancyPackageResolver::class);

    $resolved = $resolver->resolve([
        '@particle-academy/react-fancy',
        'particle-academy/holy-sheet',
        '@particle-academy/not-a-real-package',
    ]);

    $bySlug = collect($resolved)->keyBy('slug');
    expect($bySlug->get('react-fancy'))->not->toBeNull();
    expect($bySlug->get('holy-sheet'))->not->toBeNull();

    $unknown = collect($resolved)->firstWhere('name', '@particle-academy/not-a-real-package');
    expect($unknown['slug'])->toBeNull();
    expect($unknown['registry_url'])->toBeNull();
});

it('extracts both package forms from text without double-counting', function () {
    $resolver = app(FancyPackageResolver::class);

    $names = $resolver->extractFromText(
        'import "@particle-academy/react-fancy"; composer require particle-academy/holy-sheet',
    );

    expect($names)->toContain('@particle-academy/react-fancy');
    expect($names)->toContain('particle-academy/holy-sheet');
    expect($names)->not->toContain('particle-academy/react-fancy'); // npm form not double-matched
});
