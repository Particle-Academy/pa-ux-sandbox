<?php

use App\Models\ShowcaseSubmission;
use App\Models\User;
use App\Services\Entitlements;
use Database\Seeders\FunLabSeeder;
use FancyHeuristics\Models\HeuristicsSite;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    $this->seed(FunLabSeeder::class);
});

function suspendAdmin(): User
{
    return User::factory()->create(['is_admin' => true]);
}

function verifiedSiteOwner(): array
{
    $owner = User::factory()->create();
    $sub = ShowcaseSubmission::create([
        'user_id' => $owner->id,
        'kind' => 'website',
        'url' => 'https://owned.example',
        'title' => 'Owned Site',
        'status' => 'verified',
    ]);
    $sub->syncHeuristicsVisibility();

    return [$owner, $sub];
}

it('suspends a user: freezes Pro, delists every site, blocks future login', function () {
    $admin = suspendAdmin();
    [$owner, $sub] = verifiedSiteOwner();
    $owner->update(['pro_override' => true]);

    // Sanity: before suspension the site is listed + the owner is Pro.
    expect($sub->fresh()->isPubliclyListable())->toBeTrue()
        ->and(HeuristicsSite::where('site_key', $sub->site_key)->value('visible'))->toBeTrue()
        ->and(app(Entitlements::class)->proSource($owner->fresh()))->toBe('manual');

    $this->actingAs($admin)
        ->post("/admin/users/{$owner->id}/toggle-suspend", ['reason' => 'spam'])
        ->assertRedirect()
        ->assertSessionHas('success');

    $owner->refresh();
    expect($owner->isSuspended())->toBeTrue()
        ->and($owner->suspension_reason)->toBe('spam')
        // Pro frozen.
        ->and(app(Entitlements::class)->proSource($owner))->toBeNull()
        // Every owned site delisted (instance + heuristics mirror + public scope).
        ->and($sub->fresh()->isPubliclyListable())->toBeFalse()
        ->and(HeuristicsSite::where('site_key', $sub->site_key)->value('visible'))->toBeFalse()
        ->and(ShowcaseSubmission::publiclyListable()->pluck('id'))->not->toContain($sub->id);
});

it('blocks a suspended user from any authenticated request', function () {
    $owner = User::factory()->create(['suspended_at' => now(), 'suspension_reason' => 'spam']);

    $this->actingAs($owner)
        ->get('/profile')
        ->assertRedirect('/login');

    $this->assertGuest();
});

it('reinstates a user: restores login + re-lists their sites', function () {
    $admin = suspendAdmin();
    [$owner, $sub] = verifiedSiteOwner();
    $owner->update(['suspended_at' => now(), 'suspension_reason' => 'spam']);
    $sub->fresh()->syncHeuristicsVisibility();
    expect(HeuristicsSite::where('site_key', $sub->site_key)->value('visible'))->toBeFalse();

    $this->actingAs($admin)
        ->post("/admin/users/{$owner->id}/toggle-suspend")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($owner->fresh()->isSuspended())->toBeFalse()
        ->and($sub->fresh()->isPubliclyListable())->toBeTrue()
        ->and(HeuristicsSite::where('site_key', $sub->site_key)->value('visible'))->toBeTrue();
});

it('refuses to suspend yourself', function () {
    $admin = suspendAdmin();

    $this->actingAs($admin)->post("/admin/users/{$admin->id}/toggle-suspend")
        ->assertSessionHas('error');

    expect($admin->fresh()->isSuspended())->toBeFalse();
});

it('refuses to suspend another admin', function () {
    $admin = suspendAdmin();
    $other = User::factory()->create(['is_admin' => true]);

    $this->actingAs($admin)->post("/admin/users/{$other->id}/toggle-suspend")
        ->assertSessionHas('error');

    expect($other->fresh()->isSuspended())->toBeFalse();
});

it('non-admins cannot reach the suspend action', function () {
    $owner = User::factory()->create(['is_admin' => false]);
    $target = User::factory()->create();

    $this->actingAs($owner)->post("/admin/users/{$target->id}/toggle-suspend")
        ->assertForbidden();
});
