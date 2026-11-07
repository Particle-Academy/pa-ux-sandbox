<?php

use App\Http\Controllers\SubscriptionController;
use App\Models\ShowcaseSubmission;
use App\Models\User;
use App\Services\Entitlements;
use App\Services\SupportEligibility;
use Database\Seeders\FunLabSeeder;
use ParticleAcademy\Fms\Facades\FMS;
use ParticleAcademy\Fms\Services\FeatureManager;
use ParticleAcademy\Fms\Services\FmsFeatureRegistry;
use Tests\TestCase;

uses(TestCase::class);

/*
 * The fancy-support dogfood binding (.ai/plans/fancy-support.md section 5.2):
 *
 *   - support-access: the support-eligibility pre-strategy. True when the user
 *     is not suspended and owns a submission that is verified, not suspended,
 *     and ownership-verified.
 *   - support-premium: a Pro feature, AND it still needs an eligible project
 *     (owner decision D5).
 *   - support-open-tickets: resource, base 5, premium 15.
 *   - support-agent-tokens: resource; the budget is the owner's number.
 */
beforeEach(function () {
    $this->seed(FunLabSeeder::class);
});

function supportUser(bool $pro = false): User
{
    $user = User::factory()->create();
    if ($pro) {
        $user->forceFill(['pro_override' => true])->save();
    }

    return $user;
}

/** @param  array<string, mixed>  $overrides */
function supportProject(User $user, array $overrides = []): ShowcaseSubmission
{
    $submission = ShowcaseSubmission::create([
        'user_id' => $user->id,
        'kind' => 'website',
        'url' => 'https://support-'.uniqid().'.example',
        'status' => 'verified',
    ]);
    $submission->forceFill(array_merge([
        'ownership_verified_at' => now(),
        'ownership_method' => 'pixel_key',
    ], $overrides))->save();

    return $submission;
}

// ── The Pro lists ────────────────────────────────────────────────────────────

it('lists support-premium as a Pro feature', function () {
    expect(Entitlements::PRO_FEATURES)->toContain('support-premium');
});

it('keeps the Pro page feature list and the Entitlements list in agreement', function () {
    $page = (new ReflectionClassConstant(SubscriptionController::class, 'PRO_FEATURES'))->getValue();
    $pageKeys = array_column($page, 'key');

    $granted = Entitlements::PRO_FEATURES;
    sort($pageKeys);
    sort($granted);

    // A feature on the page that nothing grants is a promise the app breaks; a
    // granted feature missing from the page is one nobody is told they have.
    expect($pageKeys)->toBe($granted);
});

// ── support-access ───────────────────────────────────────────────────────────

it('grants support-access to a user with an ownership-verified, verified project', function () {
    $user = supportUser();
    supportProject($user);

    expect(FMS::canAccess('support-access', $user))->toBeTrue()
        ->and(app(SupportEligibility::class)->isEligible($user))->toBeTrue();
});

it('refuses support-access when the only project is verified but ownership is not proven', function () {
    $user = supportUser();
    supportProject($user, ['ownership_verified_at' => null, 'ownership_method' => null]);

    expect(FMS::canAccess('support-access', $user))->toBeFalse();
});

it('refuses support-access when the ownership-proven project is not verified', function () {
    $user = supportUser();
    supportProject($user, ['status' => 'rejected']);

    expect(FMS::canAccess('support-access', $user))->toBeFalse();
});

it('refuses support-access when the project is suspended', function () {
    $user = supportUser();
    supportProject($user, ['suspended_at' => now()]);

    expect(FMS::canAccess('support-access', $user))->toBeFalse();
});

it('refuses support-access to a suspended user', function () {
    $user = supportUser();
    supportProject($user);
    $user->forceFill(['suspended_at' => now()])->save();

    expect(FMS::canAccess('support-access', $user->fresh()))->toBeFalse();
});

it('refuses support-access to a guest and to a user with no projects', function () {
    expect(FMS::canAccess('support-access', null))->toBeFalse()
        ->and(FMS::canAccess('support-access', supportUser()))->toBeFalse();
});

it('does not count another user\'s ownership-verified project', function () {
    supportProject(supportUser());

    expect(FMS::canAccess('support-access', supportUser()))->toBeFalse();
});

it('keeps support-access closed even if the pre-strategy is missing', function () {
    $manager = app(FeatureManager::class);
    $manager->unregisterPreStrategy(SupportEligibility::STRATEGY);

    expect(FMS::canAccess('support-access', supportUser()))->toBeFalse();
});

it('resolves support-access through the support-eligibility pre-strategy', function () {
    $user = supportUser();
    supportProject($user);

    $explain = app(FeatureManager::class)->explain('support-access', $user);

    expect($explain['source'])->toBe('pre-strategy')
        ->and($explain['detail']['name'])->toBe('support-eligibility');
});

// ── support-premium ──────────────────────────────────────────────────────────

it('grants support-premium only to a Pro user who is also eligible', function () {
    $proWithProject = supportUser(pro: true);
    supportProject($proWithProject);

    $proWithoutProject = supportUser(pro: true);

    $eligibleNotPro = supportUser();
    supportProject($eligibleNotPro);

    expect(FMS::canAccess('support-premium', $proWithProject))->toBeTrue()
        ->and(FMS::canAccess('support-premium', $proWithoutProject))->toBeFalse()
        ->and(FMS::canAccess('support-premium', $eligibleNotPro))->toBeFalse();
});

it('leaves the other Pro features alone for a Pro user with no project', function () {
    expect(FMS::canAccess('pro-themes', supportUser(pro: true)))->toBeTrue();
});

// ── support-open-tickets ─────────────────────────────────────────────────────

it('meters open tickets at the standard and premium limits from config', function () {
    config(['support.open_tickets.standard' => 5, 'support.open_tickets.premium' => 15]);

    $standard = supportUser();
    supportProject($standard);
    $premium = supportUser(pro: true);
    supportProject($premium);

    expect(FMS::canAccess('support-open-tickets', $standard))->toBeTrue()
        ->and(FMS::remaining('support-open-tickets', $standard))->toBe(5)
        ->and(FMS::remaining('support-open-tickets', $premium))->toBe(15);
});

it('ships the plan\'s open-ticket limits as the defaults', function () {
    expect(config('support.open_tickets.standard'))->toBe(5)
        ->and(config('support.open_tickets.premium'))->toBe(15);
});

it('refuses open tickets to an ineligible user', function () {
    expect(FMS::canAccess('support-open-tickets', supportUser(pro: true)))->toBeFalse();
});

// ── support-agent-tokens ─────────────────────────────────────────────────────

it('defines support-agent-tokens as a resource bounded by the configured budget', function () {
    config(['support.agent_tokens.budget' => 250000]);

    $definition = app(FmsFeatureRegistry::class)->definition('support-agent-tokens');

    expect($definition['type'])->toBe('resource')
        ->and(FMS::remaining('support-agent-tokens', supportUser()))->toBe(250000);
});

it('fails closed with no token budget until the owner sets one', function () {
    expect(config('support.agent_tokens.budget'))->toBe(0)
        ->and(FMS::remaining('support-agent-tokens', supportUser()))->toBe(0);
});
