<?php

use App\Models\Setting;
use App\Models\User;
use Tests\TestCase;

uses(TestCase::class);

it('lets an admin save the tracker snippet', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $snippet = '<script src="https://x/fancy-pixel.js" data-site="ABC"></script>';

    $this->actingAs($admin)
        ->post('/admin/settings', ['tracker_code' => $snippet])
        ->assertRedirect();

    expect(Setting::get('tracker_code'))->toBe($snippet);
});

it('forbids non-admins from the settings page', function () {
    $user = User::factory()->create(['is_admin' => false]);
    $this->actingAs($user)->get('/admin/settings')->assertForbidden();
});

it('injects the saved tracker snippet into the page', function () {
    Setting::put('tracker_code', '<script>window.__TRACKER_OK=1</script>');

    $this->get('/')
        ->assertOk()
        ->assertSee('window.__TRACKER_OK=1', false);
});

it('injects nothing when no tracker is set', function () {
    $this->get('/')
        ->assertOk()
        ->assertDontSee('fancy-pixel.global.min.js', false);
});
