<?php

use App\Models\User;
use Database\Seeders\FunLabSeeder;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    Cache::flush();
    $this->seed(FunLabSeeder::class);
});

it('awards reader-xp when a signed-in user views a docs page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get('/docs/introduction')->assertOk();

    expect($user->getProfile()->getXpFor('reader-xp'))->toBe(3);
});

it('throttles repeat docs views of the same page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get('/docs/introduction');
    $this->actingAs($user)->get('/docs/introduction');

    expect($user->getProfile()->getXpFor('reader-xp'))->toBe(3);
});

it('does not award reader-xp to guests', function () {
    $this->get('/docs/introduction')->assertOk();

    expect(\LaravelFunLab\Models\Profile::count())->toBe(0);
});

it('awards dreamer-xp when a vote is cast', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/votes', ['type' => 'dream', 'slug' => 'some-dream', 'value' => 1])
        ->assertOk();

    expect($user->getProfile()->getXpFor('dreamer-xp'))->toBe(5);
});

it('does not award dreamer-xp when clearing a vote', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->postJson('/api/votes', ['type' => 'dream', 'slug' => 'd', 'value' => 0])->assertOk();

    expect($user->getProfile()->getXpFor('dreamer-xp'))->toBe(0);
});
