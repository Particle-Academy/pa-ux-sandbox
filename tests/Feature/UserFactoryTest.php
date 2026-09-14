<?php

use App\Models\User;
use Tests\TestCase;

uses(TestCase::class);

it('makes distinct users', function () {
    $users = User::factory()->count(50)->create();

    expect($users->pluck('email')->unique())->toHaveCount(50)
        ->and($users->every(fn (User $user) => $user->name !== ''))->toBeTrue();
});
