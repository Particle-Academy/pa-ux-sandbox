<?php

use App\Jobs\ScanShowcaseSubmission;
use App\Models\ShowcaseSubmission;
use App\Models\User;
use App\Services\ShowcaseRewards;
use Database\Seeders\FunLabSeeder;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

uses(TestCase::class);

/**
 * Moderation lifecycle on the unified Sites admin (/admin/sites/*). A showcase
 * submission IS an analytics site now, so the old /admin/submissions surface was
 * folded into AdminSitesController — these tests exercise the live routes.
 */
beforeEach(function () {
    $this->seed(FunLabSeeder::class);
});

function moderator(): User
{
    return User::factory()->create(['is_admin' => true]);
}

function pendingSubmission(?User $owner = null): ShowcaseSubmission
{
    return ShowcaseSubmission::create([
        'user_id' => ($owner ?? User::factory()->create())->id,
        'kind' => 'website',
        'url' => 'https://example.com',
        'title' => 'My Project',
        'description' => 'built with fancy ui',
        'status' => 'pending',
    ]);
}

it('blocks moderation for non-admins', function () {
    $this->actingAs(User::factory()->create(['is_admin' => false]))
        ->get('/admin/sites')
        ->assertForbidden();
});

it('lists sites filtered by status', function () {
    $admin = moderator();
    pendingSubmission();

    $this->actingAs($admin)->get('/admin/sites?filter=pending')
        ->assertOk()
        ->assertSee('My Project');
});

it('verifying awards projects-xp + first-project to the submitter, once', function () {
    $admin = moderator();
    $owner = User::factory()->create();
    $submission = pendingSubmission($owner);

    $this->actingAs($admin)->post("/admin/sites/{$submission->id}/verify")
        ->assertRedirect()
        ->assertSessionHas('success');

    $owner->refresh();
    expect($submission->refresh()->status)->toBe('verified')
        ->and($submission->rewarded_at)->not->toBeNull()
        ->and($owner->getProfile()->getXpFor('projects-xp'))->toBe(200)
        ->and($owner->hasAchievement('first-project'))->toBeTrue()
        // projects-xp 0.30 rate -> 60 coins, + first-project default 50 bonus
        ->and($owner->coinBalance())->toBe(110);

    // Re-verify must NOT pay out again.
    $this->actingAs($admin)->post("/admin/sites/{$submission->id}/verify");
    expect($owner->fresh()->getProfile()->getXpFor('projects-xp'))->toBe(200);
});

it('rejecting sets status without rewarding', function () {
    $admin = moderator();
    $owner = User::factory()->create();
    $submission = pendingSubmission($owner);

    $this->actingAs($admin)->post("/admin/sites/{$submission->id}/reject")->assertRedirect();

    expect($submission->refresh()->status)->toBe('rejected')
        ->and($submission->rewarded_at)->toBeNull()
        ->and($owner->getProfile()->getXpFor('projects-xp'))->toBe(0);
});

it('features a site for N days (comp)', function () {
    $admin = moderator();
    $submission = pendingSubmission();

    $this->actingAs($admin)->post("/admin/sites/{$submission->id}/feature", ['days' => 14])
        ->assertRedirect();

    expect($submission->refresh()->isFeatured())->toBeTrue()
        ->and(now()->diffInDays($submission->featured_until))->toBeGreaterThanOrEqual(13);
});

it('unfeatures a site', function () {
    $admin = moderator();
    $submission = pendingSubmission();
    $submission->update(['featured_until' => now()->addDays(5)]);

    $this->actingAs($admin)->post("/admin/sites/{$submission->id}/unfeature")->assertRedirect();

    expect($submission->refresh()->featured_until)->toBeNull();
});

it('re-scan re-dispatches the scan job and resets status to pending', function () {
    Bus::fake();
    $admin = moderator();
    $submission = pendingSubmission();
    $submission->update(['status' => 'rejected']);

    $this->actingAs($admin)->post("/admin/sites/{$submission->id}/rescan")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($submission->refresh()->status)->toBe('pending');
    Bus::assertDispatched(ScanShowcaseSubmission::class, function (ScanShowcaseSubmission $job) use ($submission) {
        return $job->submission->is($submission);
    });
});

it('surfaces the site detail page with the real label + site_key', function () {
    $admin = moderator();
    $submission = pendingSubmission();

    $this->actingAs($admin)->get("/admin/sites/{$submission->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/SiteShow')
            ->where('site.site_key', $submission->site_key)
            ->where('site.title', 'My Project')
        );
});

it('legacy /admin/submissions URLs redirect into the unified Sites admin', function () {
    $admin = moderator();
    $submission = pendingSubmission();

    $this->actingAs($admin)->get('/admin/submissions')
        ->assertRedirect('/admin/sites');
    $this->actingAs($admin)->get("/admin/submissions/{$submission->id}")
        ->assertRedirect("/admin/sites/{$submission->id}");
});

it('ShowcaseRewards is idempotent at the service level', function () {
    $owner = User::factory()->create();
    $submission = pendingSubmission($owner);
    $submission->update(['status' => 'verified']);
    $rewards = app(ShowcaseRewards::class);

    $rewards->onVerified($submission);
    $rewards->onVerified($submission->fresh());
    $rewards->onVerified($submission->fresh());

    expect($owner->getProfile()->getXpFor('projects-xp'))->toBe(200);
});
