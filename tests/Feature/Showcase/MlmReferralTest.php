<?php

use App\Models\User;
use App\Services\Mlm\MlmProgram;
use Database\Seeders\FunLabSeeder;
use FancyMlm\Laravel\Models\Member;
use FancyMlm\Plan\CompensationPlan;
use Illuminate\Support\Facades\Cache;
use LaravelFunLab\Models\EventLog;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    Cache::flush();
    $this->seed(FunLabSeeder::class); // registers referral-bonus + network-activity metrics
});

it('renders the referrals page with the signed-in user rooted in the network', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get('/referrals')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Referrals/Show')
            ->has('network')
            ->where('program.tree', 'unilevel'));
});

it('pays the upline a tier-scaled referral bonus when a downline member acts', function () {
    $user = User::factory()->create();
    $program = app(MlmProgram::class);

    // Root member linked to the user (gold → 1.5×); one downline member acts.
    $root = $program->memberForUser($user);
    $root->update(['tier' => 'gold']);
    $child = Member::query()->create(['sponsor_id' => $root->getKey(), 'placement_id' => $root->getKey(), 'tier' => 'bronze', 'active' => true]);

    $rewards = $program->simulateActivity($child, 100.0);

    // Level 1 upline (root) earns 100 × 1.0 × 1.5 = 150.
    expect($rewards)->toHaveCount(1);
    $log = EventLog::query()->where('source', 'mlm')->first();
    expect($log)->not->toBeNull();
    expect((int) $log->amount)->toBe(150);
    expect((int) $log->awardable_id)->toBe($user->getKey());
});

it('switches the live downline tree from the admin config surface', function () {
    $admin = User::factory()->create(['is_admin' => true]);

    $this->actingAs($admin)->put('/admin/mlm', [
        'tree' => 'binary',
        'width' => 2,
        'levelFactors' => [1.0, 0.5],
        'compression' => true,
        'tiers' => ['bronze' => 1.0, 'gold' => 1.5],
    ])->assertRedirect();

    // The Setting-backed plan is live immediately — the container resolves it.
    expect(app(MlmProgram::class)->plan()->tree)->toBe(CompensationPlan::TREE_BINARY);
    expect(app(CompensationPlan::class)->tree)->toBe(CompensationPlan::TREE_BINARY);
});

it('rejects an invalid tree type', function () {
    $admin = User::factory()->create(['is_admin' => true]);

    $this->actingAs($admin)->put('/admin/mlm', [
        'tree' => 'pyramid',
        'width' => 2,
        'levelFactors' => [1.0],
        'compression' => true,
        'tiers' => ['bronze' => 1.0],
    ])->assertSessionHasErrors('tree');
});

it('guards the admin config surface behind the admin gate', function () {
    $user = User::factory()->create(['is_admin' => false]);

    $this->actingAs($user)->get('/admin/mlm')->assertForbidden();
});
