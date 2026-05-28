<?php

use App\Jobs\ScanShowcaseSubmission;
use App\Models\ShowcaseSubmission;
use App\Models\User;
use App\Services\ShowcaseRewards;
use Database\Seeders\FunLabSeeder;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    $this->seed(FunLabSeeder::class);
});

function badgeSubmission(User $owner): ShowcaseSubmission
{
    return ShowcaseSubmission::create([
        'user_id' => $owner->id,
        'kind' => 'website',
        'url' => 'https://built-with-fancy.example',
        'title' => 'Fan Site',
        'status' => 'pending',
    ]);
}

it('awards promotion-xp + badge-bearer once when a badge is detected', function () {
    $owner = User::factory()->create();
    $submission = badgeSubmission($owner);
    $rewards = app(ShowcaseRewards::class);

    $rewards->onBadgeDetected($submission);
    $rewards->onBadgeDetected($submission->fresh()); // idempotent

    $owner->refresh();
    expect($submission->fresh()->promotion_rewarded_at)->not->toBeNull()
        ->and($owner->getProfile()->getXpFor('promotion-xp'))->toBe(300)
        ->and($owner->hasAchievement('badge-bearer'))->toBeTrue()
        // promotion-xp 0.50 rate -> 150 coins + badge-bearer bonus 250
        ->and($owner->coinBalance())->toBe(400);
});

it('detects the badge during a website scan and rewards promotion', function () {
    Http::fake([
        '*' => Http::response('<html><body><a data-fancy-badge href="#">Powered by Fancy UI</a></body></html>', 200),
    ]);

    $owner = User::factory()->create();
    $submission = badgeSubmission($owner);

    (new ScanShowcaseSubmission($submission))->handle();

    expect($submission->fresh()->scan_result['badge'] ?? false)->toBeTrue()
        ->and($owner->fresh()->getProfile()->getXpFor('promotion-xp'))->toBe(300);
});

it('does not award promotion when no badge is present', function () {
    Http::fake([
        '*' => Http::response('<html><body>@particle-academy/react-fancy used here</body></html>', 200),
    ]);

    $owner = User::factory()->create();
    $submission = badgeSubmission($owner);

    (new ScanShowcaseSubmission($submission))->handle();

    expect($submission->fresh()->promotion_rewarded_at)->toBeNull()
        ->and($owner->fresh()->getProfile()->getXpFor('promotion-xp'))->toBe(0);
});
