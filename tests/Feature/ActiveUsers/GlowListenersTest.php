<?php

use App\Models\ActiveUser;
use App\Models\User;
use Database\Seeders\FunLabSeeder;
use LaravelFunLab\Facades\LFL;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    $this->seed(FunLabSeeder::class);
});

it('records an XP-glow presence row when a user earns XP', function () {
    $user = User::factory()->create();

    LFL::award('bridge-xp')->to($user)->amount(40)->because('crushed a demo')->save();

    $row = ActiveUser::where('user_id', $user->id)->first();

    expect($row)->not->toBeNull()
        ->and($row->is_xp)->toBeTrue()
        ->and($row->is_achievement)->toBeFalse()
        ->and($row->activity_type)->toBe('xp')
        ->and($row->activity_label)->toContain('40 XP');
});

it('records an achievement-glow presence row when a user unlocks one', function () {
    $user = User::factory()->create();

    LFL::grant('first-pr')->to($user)->save();

    $row = ActiveUser::where('user_id', $user->id)->first();

    expect($row)->not->toBeNull()
        ->and($row->is_achievement)->toBeTrue()
        ->and($row->activity_type)->toBe('achievement')
        ->and($row->activity_label)->toContain('unlocked');
});
