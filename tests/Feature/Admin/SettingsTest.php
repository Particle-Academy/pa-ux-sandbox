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

it('injects the saved tracker snippet into the page once analytics consent is given', function () {
    Setting::put('tracker_code', '<script>window.__TRACKER_OK=1</script>');

    // fancy-compliance: a tracker is analytics, so a visitor who has not
    // decided (or refused) never receives it.
    $this->get('/')
        ->assertOk()
        ->assertDontSee('window.__TRACKER_OK=1', false);

    $token = $this->postJson('/fancy-compliance/consent', ['granted' => ['analytics'], 'source' => 'banner'])
        ->getCookie('fancy_compliance_subject')->getValue();

    $this->withCookie('fancy_compliance_subject', $token)
        ->get('/')
        ->assertOk()
        ->assertSee('window.__TRACKER_OK=1', false);
});

it('injects nothing when no tracker is set', function () {
    $this->get('/')
        ->assertOk()
        ->assertDontSee('fancy-pixel.global.min.js', false);
});
