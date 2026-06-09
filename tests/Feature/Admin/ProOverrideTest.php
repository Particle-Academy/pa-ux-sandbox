<?php

use App\Models\User;
use App\Services\Entitlements;
use Tests\TestCase;

uses(TestCase::class);

it('treats a manual pro_override as a "manual" Pro source', function () {
    $user = User::factory()->create(['pro_override' => false]);
    expect(app(Entitlements::class)->proSource($user))->toBeNull();

    $user->update(['pro_override' => true]);
    expect(app(Entitlements::class)->isPro($user))->toBeTrue()
        ->and(app(Entitlements::class)->proSource($user))->toBe('manual');
});

it('lets an admin grant + revoke a user\'s manual Pro', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $target = User::factory()->create(['pro_override' => false]);

    $this->actingAs($admin)->post("/admin/users/{$target->id}/toggle-pro")->assertRedirect();
    expect($target->fresh()->pro_override)->toBeTrue();

    $this->actingAs($admin)->post("/admin/users/{$target->id}/toggle-pro")->assertRedirect();
    expect($target->fresh()->pro_override)->toBeFalse();
});

it('blocks non-admins from granting Pro', function () {
    $user = User::factory()->create(['is_admin' => false]);
    $target = User::factory()->create();

    $this->actingAs($user)->post("/admin/users/{$target->id}/toggle-pro")->assertForbidden();
    expect($target->fresh()->pro_override)->toBeFalse();
});
