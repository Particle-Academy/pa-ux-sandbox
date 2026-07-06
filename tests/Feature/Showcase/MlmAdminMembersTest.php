<?php

use App\Models\User;
use Database\Seeders\MlmNetworkSeeder;
use FancyMlm\Laravel\Models\Member;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    Cache::flush();
    $this->admin = User::factory()->create(['is_admin' => true]);
});

function makeMember(array $attrs = []): Member
{
    return Member::query()->create(array_merge([
        'tier' => 'bronze',
        'active' => true,
    ], $attrs));
}

it('lists members and eligible users on the admin page', function () {
    $user = User::factory()->create();
    makeMember(['meta' => ['label' => 'Solo', 'demo' => true]]);

    $this->actingAs($this->admin)->get('/admin/mlm')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Mlm/Index')
            ->has('members', 1)
            ->where('members.0.demo', true)
            ->has('eligibleUsers')
            ->has('tierKeys'));
});

it('edits a member: sponsor, placement, tier, active', function () {
    $a = makeMember(['meta' => ['label' => 'A']]);
    $b = makeMember(['meta' => ['label' => 'B']]);
    $c = makeMember(['sponsor_id' => $b->getKey(), 'meta' => ['label' => 'C']]);

    $this->actingAs($this->admin)->put("/admin/mlm/members/{$c->getKey()}", [
        'sponsor_id' => $a->getKey(),
        'placement_id' => $a->getKey(),
        'tier' => 'gold',
        'active' => false,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $c->refresh();
    expect((int) $c->sponsor_id)->toBe($a->getKey());
    expect((int) $c->placement_id)->toBe($a->getKey());
    expect($c->tier)->toBe('gold');
    expect($c->active)->toBeFalse();
});

it('rejects making a member a child of its own descendant (cycle)', function () {
    $a = makeMember(['meta' => ['label' => 'A']]);
    $b = makeMember(['sponsor_id' => $a->getKey(), 'meta' => ['label' => 'B']]);
    $c = makeMember(['sponsor_id' => $b->getKey(), 'meta' => ['label' => 'C']]);

    // A → B → C, then trying to sponsor A under C would loop the sponsor tree.
    $this->actingAs($this->admin)->put("/admin/mlm/members/{$a->getKey()}", [
        'sponsor_id' => $c->getKey(),
        'placement_id' => null,
        'tier' => 'bronze',
        'active' => true,
    ])->assertSessionHasErrors('sponsor_id');

    expect(Member::query()->find($a->getKey())->sponsor_id)->toBeNull();
});

it('rejects a cyclic placement assignment through the placement fallback edge', function () {
    $a = makeMember(['meta' => ['label' => 'A']]);
    // B has no placement of its own — the placement edge falls back to its sponsor (A).
    $b = makeMember(['sponsor_id' => $a->getKey(), 'meta' => ['label' => 'B']]);

    $this->actingAs($this->admin)->put("/admin/mlm/members/{$a->getKey()}", [
        'sponsor_id' => null,
        'placement_id' => $b->getKey(),
        'tier' => 'bronze',
        'active' => true,
    ])->assertSessionHasErrors('placement_id');
});

it('rejects a member sponsoring themselves', function () {
    $a = makeMember(['meta' => ['label' => 'A']]);

    $this->actingAs($this->admin)->put("/admin/mlm/members/{$a->getKey()}", [
        'sponsor_id' => $a->getKey(),
        'placement_id' => null,
        'tier' => 'bronze',
        'active' => true,
    ])->assertSessionHasErrors('sponsor_id');
});

it('validates the tier against the current plan', function () {
    $a = makeMember(['meta' => ['label' => 'A']]);

    $this->actingAs($this->admin)->put("/admin/mlm/members/{$a->getKey()}", [
        'sponsor_id' => null,
        'placement_id' => null,
        'tier' => 'platinum', // not a plan tier
        'active' => true,
    ])->assertSessionHasErrors('tier');
});

it('creates a member for an existing user without one', function () {
    $sponsor = makeMember(['meta' => ['label' => 'Sponsor']]);
    $user = User::factory()->create();

    $this->actingAs($this->admin)->post('/admin/mlm/members', [
        'user_id' => $user->getKey(),
        'sponsor_id' => $sponsor->getKey(),
        'placement_id' => null,
        'tier' => 'silver',
    ])->assertRedirect()->assertSessionHasNoErrors();

    $member = Member::query()->where('user_id', $user->getKey())->first();
    expect($member)->not->toBeNull();
    expect((int) $member->sponsor_id)->toBe($sponsor->getKey());
    expect($member->tier)->toBe('silver');
    expect($member->active)->toBeTrue();
});

it('rejects creating a second member for the same user', function () {
    $user = User::factory()->create();
    makeMember(['user_id' => $user->getKey()]);

    $this->actingAs($this->admin)->post('/admin/mlm/members', [
        'user_id' => $user->getKey(),
    ])->assertSessionHasErrors('user_id');

    expect(Member::query()->where('user_id', $user->getKey())->count())->toBe(1);
});

it('splices the chain when a member is deleted', function () {
    $a = makeMember(['meta' => ['label' => 'A']]);
    $b = makeMember(['sponsor_id' => $a->getKey(), 'placement_id' => $a->getKey(), 'meta' => ['label' => 'B']]);
    $c = makeMember(['sponsor_id' => $b->getKey(), 'placement_id' => $b->getKey(), 'meta' => ['label' => 'C']]);

    $this->actingAs($this->admin)->delete("/admin/mlm/members/{$b->getKey()}")
        ->assertRedirect()->assertSessionHasNoErrors();

    expect(Member::query()->find($b->getKey()))->toBeNull();
    $c->refresh();
    // C re-points to B's own upline on BOTH edges.
    expect((int) $c->sponsor_id)->toBe($a->getKey());
    expect((int) $c->placement_id)->toBe($a->getKey());
});

it('purges only demo members and splices real children back in', function () {
    $realTop = makeMember(['meta' => ['label' => 'Real top']]);
    $demoMid = makeMember(['sponsor_id' => $realTop->getKey(), 'placement_id' => $realTop->getKey(), 'meta' => ['label' => 'Demo mid', 'demo' => true]]);
    $demoLeaf = makeMember(['sponsor_id' => $demoMid->getKey(), 'placement_id' => $demoMid->getKey(), 'meta' => ['label' => 'Demo leaf', 'demo' => true]]);
    $realBottom = makeMember(['sponsor_id' => $demoLeaf->getKey(), 'placement_id' => $demoLeaf->getKey(), 'meta' => ['label' => 'Real bottom']]);

    $this->actingAs($this->admin)->post('/admin/mlm/members/purge-demo')
        ->assertRedirect()->assertSessionHasNoErrors();

    expect(Member::query()->find($demoMid->getKey()))->toBeNull();
    expect(Member::query()->find($demoLeaf->getKey()))->toBeNull();
    expect(Member::query()->find($realTop->getKey()))->not->toBeNull();

    // The real member under the demo chain re-attaches to the nearest surviving ancestor.
    $realBottom->refresh();
    expect((int) $realBottom->sponsor_id)->toBe($realTop->getKey());
    expect((int) $realBottom->placement_id)->toBe($realTop->getKey());
});

it('exposes the referral network card props on the admin user page', function () {
    $user = User::factory()->create();
    makeMember(['meta' => ['label' => 'Sponsor']]);

    // Before enrollment: no member row for this user → mlmMember is null.
    $this->actingAs($this->admin)->get("/admin/users/{$user->getKey()}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/UserShow')
            ->where('mlmMember', null)
            ->has('mlmMembers', 1)
            ->where('mlmMembers.0.label', 'Sponsor')
            ->has('mlmTierKeys')
            ->where('mlmTierKeys.0', 'bronze'));
});

it('enrolls a user from the user page card and the show props flip to the member editor', function () {
    $user = User::factory()->create();
    $sponsor = makeMember(['meta' => ['label' => 'Sponsor']]);

    // The card's enroll form: same POST route as /admin/mlm, tier null → plan defaultTier.
    $this->actingAs($this->admin)->post('/admin/mlm/members', [
        'user_id' => $user->getKey(),
        'sponsor_id' => $sponsor->getKey(),
        'placement_id' => null,
        'tier' => null,
    ])->assertRedirect()->assertSessionHasNoErrors();

    // The show page now carries the member, shaped like membersForAdmin() rows.
    $this->actingAs($this->admin)->get("/admin/users/{$user->getKey()}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/UserShow')
            ->where('mlmMember.userId', $user->getKey())
            ->where('mlmMember.sponsorId', (string) $sponsor->getKey())
            ->where('mlmMember.placementId', null)
            ->where('mlmMember.tier', 'bronze')
            ->where('mlmMember.active', true)
            ->has('mlmMembers', 2));
});

it('no-ops the demo network seeder outside the local environment', function () {
    $existing = makeMember(['meta' => ['label' => 'Pre-existing']]);

    // The test suite runs in the "testing" environment — the seeder must refuse.
    $this->seed(MlmNetworkSeeder::class);

    expect(Member::query()->count())->toBe(1);
    expect(Member::query()->find($existing->getKey()))->not->toBeNull();
});

it('guards every member-management route behind the admin gate', function () {
    $user = User::factory()->create(['is_admin' => false]);
    $member = makeMember();

    $this->actingAs($user)->post('/admin/mlm/members', ['user_id' => $user->getKey()])->assertForbidden();
    $this->actingAs($user)->put("/admin/mlm/members/{$member->getKey()}", [])->assertForbidden();
    $this->actingAs($user)->delete("/admin/mlm/members/{$member->getKey()}")->assertForbidden();
    $this->actingAs($user)->post('/admin/mlm/members/purge-demo')->assertForbidden();
});
