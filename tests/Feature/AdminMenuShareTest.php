<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

uses(TestCase::class);

it('shares an admin link for admins and never leaks the is_admin model flag', function () {
    $admin = User::factory()->create(['is_admin' => true]);

    $this->actingAs($admin)
        ->get('/')
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.admin.url', route('admin.dashboard'))
            // The raw model column must never reach the browser.
            ->missing('auth.user.is_admin')
        );
});

it('shares no admin reference at all for a regular user', function () {
    $user = User::factory()->create(['is_admin' => false]);

    $this->actingAs($user)
        ->get('/')
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.admin', null)
            ->missing('auth.user.is_admin')
        );
});

it('shares no admin reference for guests', function () {
    $this->get('/')
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.admin', null)
            ->where('auth.user', null)
        );
});
