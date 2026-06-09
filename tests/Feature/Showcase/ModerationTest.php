<?php

use App\Models\ShowcaseSubmission;
use App\Models\User;
use App\Services\Showcase\NsfwHeuristicDetector;
use Tests\TestCase;

uses(TestCase::class);

it('flags adult content but not clean pages (pre-screen, never decides)', function () {
    $detector = new NsfwHeuristicDetector;

    expect($detector->inspect('<meta name="RATING" content="RTA-5042-1996-1400-1577-RTA">')['flagged'])->toBeTrue();
    expect($detector->inspect('<meta name="rating" content="adult">')['flagged'])->toBeTrue();
    expect($detector->inspect('Live sex cam — hardcore xxx videos')['flagged'])->toBeTrue();
    // A single stray word in a blog post must NOT trip it.
    expect($detector->inspect('<p>The history of the word "porn" in media studies.</p>')['flagged'])->toBeFalse();
    expect($detector->inspect('<title>My SaaS dashboard</title>')['flagged'])->toBeFalse();
});

it('only lists publicly-listable submissions', function () {
    $user = User::factory()->create();
    $make = fn (array $attrs) => ShowcaseSubmission::create(array_merge([
        'user_id' => $user->id, 'kind' => 'website', 'url' => 'https://'.uniqid().'.test', 'status' => 'verified',
    ], $attrs));

    $listed = $make([]);
    $kids = $make(['made_for_children' => true]); // children's sites ARE listed
    $pending = $make(['status' => 'pending']);
    $declared = $make(['nsfw_declared' => true]);
    $flagged = $make(['nsfw_status' => 'flagged']);
    $confirmed = $make(['nsfw_status' => 'confirmed']);
    $suspended = $make(['suspended_at' => now()]);
    $cleared = $make(['nsfw_status' => 'cleared']); // false positive → listable

    $ids = ShowcaseSubmission::query()->publiclyListable()->pluck('id')->all();

    expect($ids)->toContain($listed->id, $kids->id, $cleared->id)
        ->not->toContain($pending->id)
        ->not->toContain($declared->id)
        ->not->toContain($flagged->id)
        ->not->toContain($confirmed->id)
        ->not->toContain($suspended->id);
});

it('skips screenshots for NSFW + children sites only', function () {
    $base = new ShowcaseSubmission(['kind' => 'website']);

    expect((clone $base)->shouldCaptureScreenshot())->toBeTrue();
    expect((new ShowcaseSubmission(['nsfw_declared' => true]))->shouldCaptureScreenshot())->toBeFalse();
    expect((new ShowcaseSubmission(['made_for_children' => true]))->shouldCaptureScreenshot())->toBeFalse();
    expect((new ShowcaseSubmission(['nsfw_status' => 'flagged']))->shouldCaptureScreenshot())->toBeFalse();
    expect((new ShowcaseSubmission(['nsfw_status' => 'confirmed']))->shouldCaptureScreenshot())->toBeFalse();
    expect((new ShowcaseSubmission(['nsfw_status' => 'cleared']))->shouldCaptureScreenshot())->toBeTrue();
});

it('disables behavioral tracking for children sites', function () {
    expect((new ShowcaseSubmission(['made_for_children' => true]))->collectsBehavior())->toBeFalse();
    expect((new ShowcaseSubmission(['made_for_children' => false]))->collectsBehavior())->toBeTrue();
});
