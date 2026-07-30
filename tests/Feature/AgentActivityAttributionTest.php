<?php

use App\Models\ActiveUser;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

uses(TestCase::class);

/**
 * An agent's actions must not be recorded as the human's.
 *
 * A co-browsing agent drives the real UI, so its navigation arrives as an
 * ordinary Inertia visit on the same authenticated session as the person's.
 * Nothing distinguished them, and the presence feed said:
 *
 *     Wish Born — on generated::hDAoBhQKlhcWhD3X
 *
 * Two defects in one line: an internal identifier as the label (fixed
 * separately), and the wrong actor. The second is the worse one — the audit
 * trail claimed the person did things their agent did, on their own screen.
 *
 * It also blocks a deliberate goal: gamification cannot score agent-driven
 * activity while agent and human events are indistinguishable.
 *
 * The header is NOT a trust boundary and does not need to be. It only decides
 * how a row already scoped to the authenticated user is labelled, so the worst a
 * forged value achieves is mislabelling one's own presence entry.
 */
beforeEach(function () {
    Route::middleware(['web', 'auth'])->get('/attribution-probe', fn () => 'ok');
});

it('records a plain visit as the human', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get('/attribution-probe')->assertOk();

    $row = ActiveUser::where('user_id', $user->id)->first();

    expect($row->actor_kind)->toBe('human');
    expect($row->actor_name)->toBeNull();
});

it('records an agent-tagged visit as the agent, naming it', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withHeaders(['X-Fancy-Actor' => 'agent', 'X-Fancy-Agent-Name' => 'Claude'])
        ->get('/attribution-probe')
        ->assertOk();

    $row = ActiveUser::where('user_id', $user->id)->first();

    expect($row->actor_kind)->toBe('agent');
    expect($row->actor_name)->toBe('Claude');
    // Still the user's row — the agent acts on their behalf, in their session.
    expect($row->user_id)->toBe($user->id);
});

it('falls back to "Agent" when the name header is missing or blank', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withHeaders(['X-Fancy-Actor' => 'agent'])
        ->get('/attribution-probe')
        ->assertOk();

    expect(ActiveUser::where('user_id', $user->id)->value('actor_name'))->toBe('Agent');
});

it('ignores an unrecognised actor value rather than trusting it', function () {
    // Anything that is not exactly "agent" is the human. A typo, or a probe,
    // must not silently create a third actor kind the UI cannot render.
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withHeaders(['X-Fancy-Actor' => 'robot'])
        ->get('/attribution-probe')
        ->assertOk();

    expect(ActiveUser::where('user_id', $user->id)->value('actor_kind'))->toBe('human');
});

it('truncates an overlong agent name instead of failing the write', function () {
    // The column is a string; an unbounded header would throw on write and take
    // down the request it was only supposed to annotate.
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withHeaders(['X-Fancy-Actor' => 'agent', 'X-Fancy-Agent-Name' => str_repeat('a', 500)])
        ->get('/attribution-probe')
        ->assertOk();

    expect(mb_strlen((string) ActiveUser::where('user_id', $user->id)->value('actor_name')))
        ->toBeLessThanOrEqual(40);
});

it('exposes the actor on the presence API, so the UI can show it', function () {
    // Persisting it is useless if the payload drops it — the pill reads this.
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withHeaders(['X-Fancy-Actor' => 'agent', 'X-Fancy-Agent-Name' => 'Claude'])
        ->get('/attribution-probe')
        ->assertOk();

    $this->actingAs($user)
        ->getJson('/active-users')
        ->assertOk()
        ->assertJsonPath('data.0.actor_kind', 'agent')
        ->assertJsonPath('data.0.actor_name', 'Claude');
});
